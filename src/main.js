
import { createElement } from "./my-vue2/core/vdom/create-element";
import { createTextVNode } from "./my-vue2/core/vdom/vnode";

let div1 = createElement('div',{attr:{id:'app'}},"Hello World");

let div2 = createTextVNode("Hello World2");

console.log("div1==>",div1)
console.log("div2==>",div2)



