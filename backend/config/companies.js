// ============================================
// COMPANIES CONFIG
// ============================================

const companies = [
  { id: 'besth', name: 'Dr. B-Esth Esztétikai Klinika', tiktokAccountId: '_000qZAcx0RdCb5A2qNQ-WmgbjYxbQq-dlPL' },
  { id: 'topark', name: 'Tópark Étterem Dunaharaszti', tiktokAccountId: '_000YVfMNF1pI7HB_hFvXurmjIHS79otUSjz' },
  { id: 'nint', name: 'Nint', tiktokAccountId: '_00072RTMsPFhEL10pmqxrP8iXYJexyvlAyO' },
  { id: 'druitz', name: 'DruITZ', tiktokAccountId: '_0003zN8N5BV50TkS3DvTpFvJh7m5cM5Wr0I' },
  { id: 'losmonos', name: 'Losmonos Mexican', tiktokAccountId: '_000Y5wLJHEGpyqzM-XcbtlQ5tk6WyqQ5SZ3' },
  { id: 'smokey', name: 'Smokey Monkies BBQ', tiktokAccountId: '_000g67wQQwlxH9259tRnAAcrxOAq_xueSOP' },
  { id: 'drinks', name: 'Drink Station', tiktokAccountId: '_000LrXYRnU_QVr9NL3SYDWjts-MEPsikmUs' },
  { id: 'trofea', name: 'Trófea Grill Étterem', tiktokAccountId: '_000baZoN0pwFvd9Tbl0eO6PCuocEsMx1l4I' },
  { id: 'cap', name: 'CAP Marketing', tiktokAccountId: '_000AsjG8AtBUD-14DwxeUet7n3HjUg1RiOJ' },
  { id: 'todo', name: 'TODO', tiktokAccountId: '_000XWJRA8c2xG8sY3h33TSWCL203M1Tlr_D' }
];

function getCompanyById(id) {
  return companies.find(c => c.id === id);
}

function getAllCompanies() {
  return companies.map(({ id, name }) => ({ id, name }));
}

function addCompany({ id, name, tiktokAccountId }) {
  const newCompany = { id, name, tiktokAccountId };
  companies.push(newCompany);
  return { id, name };
}

function removeCompany(id) {
  const index = companies.findIndex(c => c.id === id);
  if (index === -1) return false;
  companies.splice(index, 1);
  return true;
}

module.exports = { companies, getCompanyById, getAllCompanies, addCompany, removeCompany };
