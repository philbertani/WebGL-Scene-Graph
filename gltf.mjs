const buffers =
    {
      "byteLength": 140,
      "uri": "data:application/octet-stream;base64,AAAAvwAAAD8AAAAAAAAAPwAAAD8AAAAAAAAAvwAAAL8AAAAAAAAAPwAAAL8AAAAAAAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAgD8AAIA/AACAPwAAAAAAAAAAAACAPwAAAAAAAAIAAQACAAMAAQA="
    }

const url = "data:application/octet-stream;base64,AAAAvwAAAD8AAAAAAAAAPwAAAD8AAAAAAAAAvwAAAL8AAAAAAAAAPwAAAL8AAAAAAAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAgD8AAIA/AACAPwAAAAAAAAAAAACAPwAAAAAAAAIAAQACAAMAAQA="

const b64 = "AAAAvwAAAD8AAAAAAAAAPwAAAD8AAAAAAAAAvwAAAL8AAAAAAAAAPwAAAL8AAAAAAAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAgD8AAIA/AACAPwAAAAAAAAAAAACAPwAAAAAAAAIAAQACAAMAAQA="

const raw = atob(b64);

const ab = new ArrayBuffer(raw.length);
//ab is the backing store for binaryData

const binaryData = new Uint8Array(ab);
for (let i = 0; i < raw.length; i++) {
  binaryData[i] = raw.charCodeAt(i);
}

console.log(raw.length)
const dv = new DataView(ab,0,raw.length)


//true means little endian - there is no indication in the gltf whether 
//it is big or little
for (let i=0; i<128; i+=4) {
    console.log(i,dv.getFloat32(i,true))
}

for (let i=128; i<raw.length; i+=2) {
    console.log(i,dv.getUint16(i,true))
}

console.log('fetch method')

//this does the exact same thing...
fetch(url)
    .then( res => res.blob() )
    .then( blob => blob.arrayBuffer()  )
    .then( arb => {console.log(arb)
        const dv = new DataView(arb,0,140)
        console.log(dv.getFloat32(0,true))
    })







