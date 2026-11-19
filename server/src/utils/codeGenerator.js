/**
 * Entity Code and Order Number Generators
 */
const crypto = require('crypto');

const generateUserCode = (role) => {
  const prefixMap = {
    ADMIN: 'ADM',
    STAFF: 'STF',
    AGENT: 'AGT',
    CUSTOMER: 'CUS'
  };
  const prefix = prefixMap[role] || 'USR';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomSuffix}`;
};

const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${year}-${randomSuffix}`;
};

module.exports = {
  generateUserCode,
  generateOrderNumber
};
