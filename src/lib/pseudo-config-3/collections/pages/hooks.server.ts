const populateSomething = Hooks.beforeRead(() => {

})
const doSomething = Hooks.beforeUpdate(() => {

})

export const hooks = collection.hooks({
  beforeRead = [ populateSomething ]
  beforeUpdate = [doSomething]
})
