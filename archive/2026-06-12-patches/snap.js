require('dotenv').config();
const {fetchUnifiedSnapshot} = require('./dist/solanaAdapter');
fetchUnifiedSnapshot('Bgqv3W2gLUXXJGeNnP2F1yyd5xXfknVrhohKGdUVpump')
  .then(s => console.log(JSON.stringify(s, null, 2)))
  .catch(e => console.error(e.message));
