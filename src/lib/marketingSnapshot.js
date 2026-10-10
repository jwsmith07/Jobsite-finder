// Keep the public snapshot connected while the guarded app initializes off-DOM.
// No duplicate visible content or headings are inserted into the document.
let pendingRoot = null

export function prepareClientRoot(snapshot) {
  if (!snapshot.hasAttribute('data-marketing-snapshot')) return snapshot
  const client = snapshot.cloneNode(false)
  client.removeAttribute('data-marketing-snapshot')
  pendingRoot = { snapshot, client }
  return client
}

export function revealClientRoot() {
  if (!pendingRoot) return
  const { snapshot, client } = pendingRoot
  if (!snapshot.isConnected || !client.hasChildNodes()) return
  // Called after the destination view commits, before the next browser paint.
  snapshot.replaceWith(client)
  pendingRoot = null
}
