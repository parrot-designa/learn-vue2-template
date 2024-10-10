🔥从零手写vue2 - template模版编译

本专栏是打算从零手写一个 vue2，并学习 vue2 中的一些核心理念。

[专栏文章一 - 🔥从零手写vue2 - 虚拟节点以及createElement函数](https://juejin.cn/post/7421103437607370806)

# 一、template选项

在虚拟节点那节中，我们了解到vue框架是基于 vnode 来渲染页面的。

在 vue 中，可以将 template作为选项传入 vue构造函数。

而 template的值是一个模板字符串。

```js
<div>
  <span>我是爱吃水果的人</span>
  我吃各种各样的水果
  <ul>
    <li>火龙果</li>
    <li>葡萄</li>
    <li>番茄</li>
  </ul>
</div>
```


 


