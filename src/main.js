
import { createElement } from "./my-vue2/core/vdom/create-element";
import { createTextVNode } from "./my-vue2/core/vdom/vnode";
import { compileToFunctions } from "./my-vue2/platforms/web/compiler/index";

import Vue from "vue/dist/vue.esm.browser";

// let div1 = createElement('div',{attr:{id:'app'}},"Hello World");

// let div2 = createTextVNode("Hello World2");  

const { render } = compileToFunctions(`<div><span>我是爱吃水果的人</span></div>`)

new Vue({
    render
}).$mount("#app")
    
 