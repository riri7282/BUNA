// generate a stable-ish id for a name (not cryptographically secure)
function generateId(name){
  const t = Date.now().toString().slice(-6);
  const s = (name||"guest").toLowerCase().replace(/\s+/g,"").slice(0,6);
  return s + "_" + t;
}