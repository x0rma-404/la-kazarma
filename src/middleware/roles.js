'use strict';

function canEditResource(userId, resourceOwnerId) {
  return parseInt(userId, 10) === parseInt(resourceOwnerId, 10);
}

function isAdmin(req) {
  return !!(req.session.user && req.session.user.role === 'admin');
}

module.exports = { canEditResource, isAdmin };
