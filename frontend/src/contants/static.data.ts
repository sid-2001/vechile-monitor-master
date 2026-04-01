const static_list = [
  {
    name: 'verification-partner',
    'primary-key': 'verificationPartnerId',
    api: '/api/kyc/verification-partners/action',
    listname: 'Verification Partner',
    updatePrimaryKey: 'partnerId',
  },
  {
    name: 'postal-code',
    'primary-key': 'id',
    api: '/api/static-table/postalcode/action',
    listname: 'Postal Codes',
    updatePrimaryKey: 'id',
  },

    {
    name: 'postal-code',
    'primary-key': 'id',
    api: '/api/static-table/postalcode/action',
    listname: 'Postal Codes',
    updatePrimaryKey: 'id',
  },
  {
    name: 'forex-gateway',
    'primary-key': 'id',
    api: '/api/static-table/forex-gateway/action',
    listname: 'Forex Gateway',
    updatePrimaryKey: 'id',
  },
  {
    name: 'forex-certificate',
    'primary-key': 'certificateName',
    api: '/api/static-table/forex/action',
    listname: 'Forex Certificate',
    updatePrimaryKey: 'certificateName',
  },
  {
    name: 'forex-country',
    'primary-key': 'countryCode',
    api: '/api/static-table/forex/country/action',
    listname: 'Forex Country',
    updatePrimaryKey: 'countryCode',
  },
  {
    name: 'forex-currency',
    'primary-key': 'currencyCode',
    api: '/api/static-table/forex/currency/action',
    listname: 'Forex Currency',
    updatePrimaryKey: 'currencyCode',
  },
  {
    name: 'forex-bank',
    'primary-key': 'bankCode',
    api: '/api/static-table/forex/bank/action',
    listname: 'Forex Bank',
    updatePrimaryKey: 'bankCode',
  },
    {
    name: "Branches",
    'primary-key': 'bankCode',
    api: '/api/static-table/forex/branch/action',
    listname: 'Forex Branch',
    updatePrimaryKey: 'id',
  },
  
]
export default static_list
