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

        // 3. Build update query
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = ["version", "file_path", "file_hash", "file_checksum", "url"];
        for (const field of allowedFields) {
          if (updateData[field] !== undefined && updateData[field] !== null) {
            fields.push(`${field} = $${idx++}`);
            values.push(updateData[field]);
          }
        }

        if (fields.length > 0) {
          values.push(otherAppIds);
          const query = `
            UPDATE mini_apps 
            SET ${fields.join(", ")} 
            WHERE app_id = ANY($${idx})
          `;
          await activeClient.query(query, values);
          console.log(`Propagated update to group children (${otherAppIds.join(', ')}) of parent ${parentAppId}`);
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
