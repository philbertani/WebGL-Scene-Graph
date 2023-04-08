import * as m4 from "./m4.mjs";

export default Node = function (name, type = 0) {
  this.name = name;
  this.children = [];
  this.parents = [];
  this.localMatrix = m4.identity();
  this.worldMatrix = m4.identity();
  this.parentCount = 0;
  this.type = type;
};

Node.prototype.addChild = function (node) {
  this.children.push(node);
};

Node.prototype.copy = function (node) {
  const copyNode = new Node(node.name + "-copy");
  copyNode.localMatrix = node.localMatrix;
  copyNode.worldMatrix = node.worldMatrix;
  if (node.drawInfo) {
    copyNode.drawInfo = {}; //need new object
    copyNode.drawInfo.bufferInfo = this.drawInfo.bufferInfo; //copy references
    copyNode.drawInfo.programInfo = this.drawInfo.programInfo;
    copyNode.drawInfo.uniforms = node.drawInfo.uniforms;
  }
  return copyNode;
};

Node.prototype.updateWorldMatrix = function (parentWorldMatrix) {
  if (this.type === 0) {
    if (parentWorldMatrix) {
      // a matrix was passed in so do the math
      m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
    } else {
      // no matrix was passed in so just copy local to world
      m4.copy(this.localMatrix, this.worldMatrix);
    }
  }

  // now process all the children
  var worldMatrix = this.worldMatrix;
  this.children.forEach(function (child) {
    child.updateWorldMatrix(worldMatrix);
  });
};
