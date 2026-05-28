const responseHelper = require("../utils/response.helper");

/**
 * Middleware to check granular bitwise menu permissions.
 * @param {string} menuKey The menu identifier (e.g. 'mini-apps')
 * @param {number} actionBit The action bit to check: 0 for View (implicit), 1 for Add, 2 for Delete, 4 for Edit
 */
const requirePermission = (menuKey, actionBit = 0) => {
  return (req, res, next) => {
    const { username, menu_permissions } = req.user;
    
    // Bypass checks if default super admin
    if (username === 'admin') {
      return next();
    }
    
    const userPermissions = menu_permissions || {};
    
    // 1. Check View Permission (key must exist in user's permissions)
    if (!(menuKey in userPermissions)) {
      return responseHelper.error(res, "Bạn không có quyền truy cập menu này", null, 403);
    }
    
    // 2. If only View permission is required
    if (actionBit === 0) {
      return next();
    }
    
    // 3. Check Bitwise CRUD permissions (Add = 1, Delete = 2, Edit = 4)
    const menuVal = parseInt(userPermissions[menuKey]) || 0;
    if ((menuVal & actionBit) === actionBit) {
      return next();
    }
    
    return responseHelper.error(res, "Bạn không có quyền thực hiện hành động này", null, 403);
  };
};

module.exports = {
  requirePermission
};
