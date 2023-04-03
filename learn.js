//const args = Array.prototype.slice.call(arguments, 0);

function createFlattenedFunc(vertFunc) {
    return function(gl, ...args) {
        console.log(gl, ...args);
        console.log('function is',vertFunc)
        vertFunc(...args)

        console.log('zzz',Array.prototype.slice.call(arguments))  //this is very cryptic
        console.log('aaa',Array.from(arguments))
    };
  }

  function createSphereVertices(
    radius,
    subdivisionsAxis,
    subdivisionsHeight,
    opt_startLatitudeInRadians,
    opt_endLatitudeInRadians,
    opt_startLongitudeInRadians,
    opt_endLongitudeInRadians) {
        console.log('in createSpehereVertices')
    }

const funcs = {
    createSphereWithVertexColorsBufferInfo: createFlattenedFunc(createSphereVertices)
}

const xx = createFlattenedFunc(createSphereVertices)

//funcs.createSphereWithVertexColorsBufferInfo( {name:"gl struct", x:1}, 10,12,6 )

console.log(funcs.createSphereWithVertexColorsBufferInfo)
console.log(xx)

xx( {name:"gl struct2", x:1}, 20,22,16  )




