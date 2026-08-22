const db = require("../db");

/**
 * Propagates version, file_path, file_hash, file_checksum, url updates to all other mini apps in the same group.
 * @param {object} client - PG DB Client (supports transaction)
 * @param {string} app_id - The app_id of the updated app
 * @param {object} updateData - Data containing fields like version, file_path, file_hash, file_checksum, url
 */
async function propagateGroupUpdates(client, app_id, updateData) {
  try {
    const activeClient = client || db;

    // 1. Find parent app_id in mini_app_groups that is a prefix of the current app_id
    const parentGroupsRes = await activeClient.query(
      "SELECT DISTINCT app_id FROM mini_app_groups WHERE $1 LIKE app_id || '%'",
      [app_id]
    );
    if (parentGroupsRes.rows.length === 0) return;

    for (const row of parentGroupsRes.rows) {
      const parentAppId = row.app_id;

      // 2. Get all other app_ids starting with the parent prefix
      const otherAppsRes = await activeClient.query(
        "SELECT DISTINCT app_id FROM mini_apps WHERE app_id LIKE $1 || '%' AND app_id <> $2",
        [parentAppId, app_id]
      );
      
      if (otherAppsRes.rows.length > 0) {
        const otherAppIds = otherAppsRes.rows.map(r => r.app_id);

        // 3. Build update query for shared fields
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = ["version", "file_path", "file_hash", "file_checksum", "is_actived", "is_hidden", "is_maintenance"];
        for (const field of allowedFields) {
          if (updateData[field] !== undefined && updateData[field] !== null) {
            fields.push(`${field} = $${idx++}`);
            values.push(updateData[field]);
          }
        }

        if (fields.length > 0) {
          const updateValues = [...values, otherAppIds];
          const query = `
            UPDATE mini_apps 
            SET ${fields.join(", ")} 
            WHERE app_id = ANY($${idx})
          `;
          await activeClient.query(query, updateValues);
          console.log(`Propagated shared fields to group children of parent ${parentAppId}`);
        }

        // 4. Update URLs individually if url is updated
        if (updateData.url !== undefined && updateData.url !== null) {
          for (const appRow of otherAppsRes.rows) {
            const childAppId = appRow.app_id;
            
            // Get current child URL to see if it has a path
            const childCurRes = await activeClient.query("SELECT url FROM mini_apps WHERE app_id = $1", [childAppId]);
            const currentUrl = childCurRes.rows[0]?.url || "";
            
            let path = "";
            const hashIdx = currentUrl.indexOf("/#");
            if (hashIdx !== -1) {
              path = currentUrl.substring(hashIdx);
            } else {
              // Fallback: extract from app_id suffix
              const suffix = childAppId.substring(parentAppId.length);
              if (suffix === ".home") {
                path = "/#/";
              } else if (suffix.startsWith(".")) {
                path = `/#/${suffix.substring(1)}`;
              }
            }
            
            // Normalize parent URL (strip trailing slash if path starts with slash)
            let baseUrl = updateData.url;
            if (baseUrl.endsWith("/")) {
              baseUrl = baseUrl.substring(0, baseUrl.length - 1);
            }
            const newChildUrl = baseUrl + path;
            
            await activeClient.query(
              "UPDATE mini_apps SET url = $1 WHERE app_id = $2",
              [newChildUrl, childAppId]
            );
            console.log(`Updated child ${childAppId} URL to ${newChildUrl}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to propagate group updates:", err);
    throw err;
  }
}

module.exports = {
  propagateGroupUpdates
};
