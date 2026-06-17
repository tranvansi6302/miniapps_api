const db = require("../db");
const moderationLogService = require("./moderation-log.service");

class MiniAppBuildService {
  async list(miniAppId) {
    const result = await db.query(
      `SELECT id, mini_app_id, version, changelog, reviewer_notes, status, file_path, file_hash, file_checksum, created_at 
       FROM mini_app_builds 
       WHERE mini_app_id = $1 
       ORDER BY id DESC`,
      [miniAppId]
    );
    return result.rows.map(row => ({
      ...row,
      id: parseInt(row.id),
      mini_app_id: parseInt(row.mini_app_id)
    }));
  }

  async create(miniAppId, { version, changelog, reviewer_notes, file_path, file_hash, file_checksum }) {
    // Check if the mini app exists
    const checkApp = await db.query("SELECT id FROM mini_apps WHERE id = $1", [miniAppId]);
    if (checkApp.rows.length === 0) {
      throw new Error("Mini App not found");
    }

    // Check duplicate version
    const checkVersion = await db.query(
      "SELECT id FROM mini_app_builds WHERE mini_app_id = $1 AND version = $2",
      [miniAppId, version]
    );
    if (checkVersion.rows.length > 0) {
      throw new Error("Build with this version already exists for this Mini App");
    }

    const result = await db.query(
      `INSERT INTO mini_app_builds (mini_app_id, version, changelog, reviewer_notes, file_path, file_hash, file_checksum)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, mini_app_id, version, changelog, reviewer_notes, status, file_path, file_hash, file_checksum, created_at`,
      [miniAppId, version, changelog, reviewer_notes, file_path, file_hash || null, file_checksum || null]
    );

    const build = result.rows[0];
    return {
      ...build,
      id: parseInt(build.id),
      mini_app_id: parseInt(build.mini_app_id)
    };
  }

  async updateStatus(miniAppId, id, status, performedBy = "admin", checklist = {}) {
    // Validate status value
    const parsedStatus = parseInt(status);
    if (![1, 2, 3].includes(parsedStatus)) {
      throw new Error("Invalid status code");
    }

    // Check if build exists and belongs to app
    const checkBuild = await db.query(
      "SELECT id, version, file_path, file_hash, file_checksum FROM mini_app_builds WHERE id = $1 AND mini_app_id = $2",
      [id, miniAppId]
    );
    if (checkBuild.rows.length === 0) {
      throw new Error("Build not found");
    }

    const buildVersion = checkBuild.rows[0].version;
    const buildFilePath = checkBuild.rows[0].file_path;
    const buildFileHash = checkBuild.rows[0].file_hash;
    const buildFileChecksum = checkBuild.rows[0].file_checksum;

    // Run in a transaction
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // Update status
      const updateBuildRes = await client.query(
        `UPDATE mini_app_builds 
         SET status = $1 
         WHERE id = $2 AND mini_app_id = $3
         RETURNING id, mini_app_id, version, changelog, reviewer_notes, status, file_path, file_hash, file_checksum, created_at`,
        [parsedStatus, id, miniAppId]
      );

      // If approved (status = 2), update version, file_path, file_hash, file_checksum in parent mini_apps table
      if (parsedStatus === 2) {
        await client.query(
          `UPDATE mini_apps 
           SET version = $1, file_path = $2, file_hash = $3, file_checksum = $4 
           WHERE id = $5`,
          [buildVersion, buildFilePath, buildFileHash, buildFileChecksum, miniAppId]
        );
      }

      // Log moderation event
      const logAction = parsedStatus === 2 ? "APPROVE_BUILD" : "REJECT_BUILD";
      await client.query(
        `INSERT INTO mini_app_moderation_logs (mini_app_id, build_id, action, version, performed_by, checklist)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [miniAppId, id, logAction, buildVersion, performedBy, JSON.stringify(checklist)]
      );

      await client.query("COMMIT");

      const build = updateBuildRes.rows[0];
      return {
        ...build,
        id: parseInt(build.id),
        mini_app_id: parseInt(build.mini_app_id)
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new MiniAppBuildService();
