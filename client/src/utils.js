
export let deepCopyObject = (obj) => {
  let cpy = {};
  for(let key in obj) {
    if(obj[key] !== undefined && typeof(obj[key]) === 'object') cpy[key] = deepCopyObject(obj[key]);
    else cpy[key] = obj[key];
  }
  return cpy;
};

export let objectsDeepEqual = (lhs,rhs) => {
  let lKeys = Object.keys(lhs);
  let rKeys = Object.keys(rhs);
  // keys not same length or not same
  if(lKeys.length !== rKeys.length || !lKeys.every((lKey) => rKeys.includes(lKey))) {
    return false;
  }
  return lKeys.every((key)=> {
    if(typeof(lhs[key]) === 'object') return objectsDeepEqual(lhs[key],rhs[key]);
    else return lhs[key] === rhs[key];
  });
};

export let basicRequestCatch = (tag) => (err) => {
  // got response from server
  if(err.response) {
    console.log(tag,err.response);
  }
  // request sent but no response
  else if(err.request) {
    console.log(tag,err.request);
  }
  // catch all
  else {
    console.log(tag,err);
  }
}
