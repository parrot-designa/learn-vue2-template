
import { createElement } from "./my-vue2/core/vdom/create-element";
import { createTextVNode } from "./my-vue2/core/vdom/vnode";

import Vue from "vue/dist/vue.esm.browser";

let div1 = createElement('div',{attr:{id:'app'}},"Hello World");

let div2 = createTextVNode("Hello World2"); 

new Vue({
    template:`
        <div>
            <span>我是爱吃水果的人</span>
            我吃各种各样的水果
            <ul>
                <li>火龙果</li>
                <li>葡萄</li>
                <li>番茄</li>
            </ul>
        </div>
    `
}).$mount("#app");
 