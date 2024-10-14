🔥从零手写vue2 - template模版解析

本专栏是打算从零手写一个 vue2，并学习 vue2 中的一些核心理念。

[专栏文章一 - 🔥从零手写vue2 - 虚拟节点以及createElement函数](https://juejin.cn/post/7421103437607370806)

# 一、template选项

在虚拟节点那节中，我们了解到 vue框架 是基于 vnode 来渲染页面的。

在 vue 中，可以将 template 作为选项传入 vue 构造函数。

```js
new Vue({
  template:`我是 template 内容，是一个模板字符串`
})
```
template内容如下。
```js
"<div>
  <span>我是爱吃水果的人</span>
  我吃各种各样的水果
  <ul>
    <li>火龙果</li>
    <li>葡萄</li>
    <li>番茄</li>
  </ul>
</div>"
```
vue 就是将这样一个模板字符串变成 vnode 的。

拿到 vnode以后，就可以将 vnode转化成真实 DOM 元素然后渲染到页面上。

渲染功能我们后面的章节会带着大家一步一步去实现。

我们在本章中会一步一步带大家实现这样一个模板解析器。

# 二、模板编译转化步骤

在 vue-template-compiler 中，模板解析大致分为 2 步：

1. 将模板转化成 AST
2. 将 AST转化成 render 函数 

所以上面的模板最终会变成下面的render函数：

```js
render:new Function(`with(this){return _c('div',[
  _c('span',[
    _v("我是爱吃水果的人")
  ]),
  _v("            我吃各种各样的水果            "),
  _c('ul',[
    _c('li',[_v("火龙果")]),
    _v(" "),
    _c('li',[_v("葡萄")]),
    _v(" "),
    _c('li',[_v("番茄")])
  ])
])}`)
``` 

> _c就是我们上一篇文章提到的 createElement 。
>
> createElement是方便我们生成 vnode的。
>
> _v就是我们上一篇文章提到的创建文本的函数：```createTextVNode```。

```new Function()``` 可以根据参数内容生成一个函数。

而```with(this)```语句意味着函数体内的所有变量都将从 this对象中查找，比如上面的```_v、_c```。

所以执行生成的 render 函数就可以获取模板对应的 vnode。

## 2.1 第一步：将 template模板 转化成 AST

因为模板就是一段字符串，是非结构化的数据，不利于进行分析。

所以第一步是将非结构化的模板字符串，换变成结构化的 JS对象，抽象语法树，即 AST。

这个网站[ast](https://astexplorer.net/)可以将模板转成成对应的 AST。

> 注意解析内容选择 ```Vue```，解析器选择 ```vue-template-compiler```。

![alt text](image.png)


## 2.2 第二步：将 AST 转化为 render 函数

在得到 模板 对应的 AST 对象以后。
 
先转换为一段函数体的字符串，然后再用 ```new Function(`with(this){return 函数题字符串}`)```生成对应的 render函数。

# 三、编译器模板源码编写

在 vue 源码中，是使用 compileToFunctions 传入 template 生成 render函数。

```js
const { render, staticRenderFns } = compileToFunctions(
    template,
    {
      outputSourceRange: __DEV__,
      shouldDecodeNewlines,
      shouldDecodeNewlinesForHref,
      delimiters: options.delimiters,
      comments: options.comments
    },
    this
)
```

而 compileToFunctions 函数是使用 createCompiler 函数进行生成的。

很容易写出以下代码。

```js
// platforms/web/compiler.js
import { createCompiler } from "@/my-vue2/compiler";

const { compileToFunctions } = createCompiler();

export {
    compileToFunctions
}

// compiler/index.js

export const createCompiler = () => {
    return {
        compileToFunctions:(template, options, vm)=>{
            // 1.生成AST
            const ast = parse(template.trim(), options);
            // 2.AST生成 render
            const render = generate(ast, options);
            return {
                render
            }
        }
    }
}
```
所以我们只需要实现 parse 和 generate 即可。

# 四、如何将 template模板 转化成 AST？ 

上面我们知道 vue 中是使用 parse 函数来实现。

该函数的作用是将模板变成 AST树。

## 4.1 核心原理介绍 - 标签和栈

![alt text](image-1.png) 

如上图，正常的一个模板字符串内容是一棵规范的DOM树。

每个标签（如：```<div></div>```）上都有属于自己的开始标签（```<```）、闭合标签（```>```）和结束标签（```</```）。

自闭合标签（如：```<img />```）只有开始标签（```<```）和结束/闭合标签（```/>```）。

根据这个规律，我们发现每一个开始标签一定有对应的闭合标签。

这种一一对应的关系很容易让人联想到使用栈来实现这个功能。

> ```栈顶中的字符表示正在解析中的字符```。
>
> ```解析中遇到的子元素信息、属性信息都可以设置在栈顶的元素中```。
>
> ```当一个字符解析完以后就将栈顶元素移除```。
>
> ```当栈变成空时，代表已经解析完毕```。
>
> 栈是一个有序的数组结构，很容易理解，```栈顶的元素是栈顶下面元素的子元素```。

### 4.1.1 初始化解析

![alt text](image/1.jpg) 

> 红色指针代表字符串解析的位置索引。
>
> 红色曲线指针指向当前栈顶元素。
>
> 右边方块代表解析过程中形成的堆栈。

从模板第一位开始解析，解析位置为 0。 代表没有开始解析，此时堆栈为空。

这个时候构建一个root对象，用作最终解析的 AST对象。

```js
let ast = {}
```

### 4.1.2 解析第一个标签 （div）

![alt text](image/2.jpg)

* 解析步骤：

1. 初始化时指针索引移到第一位。解析发现 ```<```(且不是```</```)，意味碰到了元素开始标签。

2. 指针继续向后移动解析```<```元素开始标签以及对应的```>```元素结束标签。

3. 直至解析到```>```，说明该标签已经解析完成。当解析器解析完一个标签后，将这个标签推入堆栈中。

> 此时栈中只有一个元素 div，所以栈顶是 div元素。

4. 此时解析指针向后移动，移动到```<span>```标签的```<```开始标签上。

* AST对象变化：

因为这个div是第一个元素，也就是根对象，所以直接将信息放在 ast对象上。

此时可以更新这个 AST对象。

```js
let ast = {
  tag: 'div',
  type: 1
}
```

> vue ast 中 type为 1 表示一个元素类型

### 4.1.3 解析第二个标签（span）

![alt text](image/3.jpg)

* 解析步骤：

1. 此时指针索引移到```<span>```第一位。解析发现 ```<```，且不是```</```，标识碰到了元素开始标签。

2. 指针继续向后移动解析```<```元素开始标签以及对应的```>```元素结束标签。

3.  直至解析到```>```，说明该标签已经解析完成。当解析器解析完一个标签后，将这个标签推入堆栈中。

> 此时栈中有一个元素 div和一个元素 span，栈顶是 span 元素。

4. 此时解析指针向后移动，移动到```<span>```标签内部的文字上。

* AST对象变化：

很明显span元素是 div元素的子元素。

我们将 children 属性当做子元素。

```js
let ast = {
  type:1,
  tag:'div',
  children:[
    {
      type:1,
      tag:'span'
    }
  ]
}
```

### 4.1.4 解析标签内部文字

![alt text](image/4.jpg)

* 解析步骤：

1. 此时指针索引在span内文字的第一个位置，发现不是```<```标签，意味着可能是文字内容，文字内容在 AST中也被解析为一个节点，放置在子元素中。

2. 指针继续向后移动解析，直至遇到了```<```元素。这表示文字解析完毕。

3. 截取指针移动过的所有字符，当做栈顶处理中元素的子节点。

> 此时栈中有一个元素 div和一个元素 span，栈顶依然是 span 元素。 

* AST对象变化：

我们将截取的文字当做文字节点传进 span的 children属性中。

```js
let ast = {
  type:1,
  tag:'div',
  children:[
    {
      type:1,
      tag:'span',
      children:[
        {
          type:3,
          text:'我是爱吃水果的人'
        }
      ]
    }
  ]
}
```

> vue ast 中 type为 3 表示一个文本类型，text为文本的值。

### 4.1.5 解析标签结束标签（```</span```）

![alt text](image/5.jpg)

* 解析步骤：

1. 此时指针索引在```<```位上，然后发现该位置上的第二个标签是```/```，这意味着这个时候解析到了元素的闭合标签。

2. 指针继续移动，直至遇到```>```获取到元素对应的 ```tag为 span```。然后查看是否和栈顶元素一样，发现一样。然后移除栈顶span元素。

> 此时栈中只有一个元素 div，则栈顶是 div 元素。 

3. 指针继续向后移动。

* AST对象变化：

此时虽然栈顶元素移除了，只是意味着 span 元素不会再新增属性了。

所以AST对象没有什么变化。

```js
let ast = {
  type:1,
  tag:'div',
  children:[
    {
      type:1,
      tag:'span',
      children:[
        {
          type:3,
          text:'我是爱吃水果的人'
        }
      ]
    }
  ]
}
```

### 4.1.6 解析标签结束标签（```</div```）


![alt text](image/6.jpg)

* 解析步骤：

1. 此时指针索引在```<```位上，然后发现该位置上的第二个标签是```/```，这意味着这个时候解析到了元素的闭合标签。

2. 指针继续移动，直至遇到```>```获取到元素对应的 ```tag为 div```。然后查看是否和栈顶元素一样，发现一样。然后移除栈顶div元素。

> 此时栈中元素已经清空，代表已经解析完成。 

3. 此时字符串已经解析完成。

* AST对象变化：

此时模板已经全部解析完毕。

```js
let ast = {
  type:1,
  tag:'div',
  children:[
    {
      type:1,
      tag:'span',
      children:[
        {
          type:3,
          text:'我是爱吃水果的人'
        }
      ]
    }
  ]
}
```

## 4.2 源码编写-parse函数大致结构 

我们按照vue源码的目录结构。

定义 parse函数，然后再 parse函数中返回 AST。

其中html-parser是专门用来解析 html模版的。

```js
// compiler/parse/index.js
import { parseHTML } from "./html-parser";

export function parse(template,options){

    let rootAst = {};
    
    parseHTML(template); 

    return rootAst;
}
// compiler/parse/html-parser.js
// 解析模板
export function parseHTML(html){ 
}
```

## 4.3 源码编写-html-parser

### 4.3.1 遍历模板

while 循环在这里的作用是确保每次迭代都会处理一部分 HTML 字符串，直到没有剩余的字符串需要处理为止。

这样的循环结构适合用于处理不确定长度的数据流，直到所有数据都被消费掉为止。

```js
// 解析模板
export function parseHTML(html){
  // while 循环会持续进行，直到 html 变成了空字符串。
  while(html){      
  }
}
```

### 4.3.2 依据 ```<``` 进行判断

```js
while(html){
  const textEnd = html.indexOf("<")
}
```
> ```textEnd 变量存储了 < 符号首次出现的位置。``` 

那么为什么是```<```符号呢？

> 因为在 HTML 中，```<``` 符号通常标志着一个新的标签的开始。
>
> 因此，在解析过程中查找 ```<``` 符号可以帮助我们确定何时开始处理一个新的 HTML 标签。

当解析器遇到 ```<``` 符号时，它会根据后续的字符来判断接下来的内容是标签、注释还是其他结构：

1. 如果紧随 < 后面的是 /，则表示这是一个结束标签；
2. 如果紧随 < 后面的是 !，则可能是 HTML5 的文档类型声明（DOCTYPE）；
3. 如果是其他字母，则可能是一个开始标签。



### 4.3.3 定义匹配的相关正则

vue源码需要精确的匹配符号，所以使用正则：

1. unicodeRegExp

```js
// core/util/lang
export const unicodeRegExp =
  /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/
```

用来匹配 Unicode 字符集中的一系列字符，这些字符通常被认为是“字母”或“标识符”的一部分。

这里就是匹配标签名。

2. ncname

```js
// source代表正则
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`
```
用来匹配非限定名称，也就是不包含冒号的 XML 名称或属性名。其中首字母为必须为```a-z、A-Z、_```的其中一项。

3. qnameCapture

```js
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
```
用来匹配所谓的 “限定名称”。（Qualified Name，简称 QName）。

该表达式可以匹配：

* 不带前缀的QName：例如element、attribute。
* 带前缀的 QName：例如ns:element、prefiex:attr。

4. startTagOpen

```js
const startTagOpen = new RegExp(`^<${qnameCapture}`)
```
用于匹配HTML开始标签的开头部分。

这个正则可以匹配```<div>```、```<foo:bar>```等标签的开头部分。

5. startTagClose 

```js
const startTagClose = /^\s*(\/?)>/
```
用来匹配HTML标签的结束部分，即从标签的结束符号 ```>``` 开始之前的空白字符（如果有）到 > 本身。

这个正则可以匹配```>```、```/>```、```    >```这四种情况。

6. endTag

```js
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
```

用来匹配 HTML 或 XML 中的结束标签（也称为闭合标签）。这个正则表达式的设计目的是为了识别一个标签的结束，并且捕获该标签的名称。

7. attribute

用来匹配 HTML 或 XML 中的属性（attributes）。

```js
const attribute =
  /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
```
8. dynamicArgAttribute

用来匹配 Vue.js 中动态参数（动态参数化）的属性。

这种属性通常出现在 Vue 的指令、事件监听器、绑定等语法中，允许使用方括号 [] 来传递动态参数。

```js
const dynamicArgAttribute =
  /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
```

### 4.3.4 advance

因为我们使用的是 while循环，且循环条件为 html。

所以我们每次解析完以后需要将html解析过的部分去除。

如果不处理 html则会无限循环下去。

```js
function advance(){
  html = html.substring(n)
}
```


### 4.3.5 html-parser的三个阶段

我们知道 ast 是在 parse函数内部的。

那么 html-parser是如何跟 ast进行通信的呢？

当html-parser解析```开始标签、结束标签、文本之后```，会调用回调。

```js
parseHTML(template,{
  // 开始标签
  start:()=>{},
  // 结束标签
  end:()=>{},
  // 文字
  char:()=>{},
}); 
// html-parser
export function parseHTML(html,options){ 
  if(解析完开始元素){
    options.start()
  }
  if(解析完结束元素){
    options.end()
  }
  if(解析完文本){
    options.char()
  }
}
``` 

### 4.3.6 html-parser处理开始标签

```js
// 说明匹配到 <  可能是开始标签（<）或者闭合标签（</）
  if(textEnd === 0){
    // 解析开始标签
    const startTagMatch = parseStartTag();
    if(startTagMatch){ 
      options.start(startTagMatch);
      continue
    }
  }

  function parseStartTag(){
    // 如果html为<div> 则 start[0]为<div start[1]为 tag
    const start = html.match(startTagOpen);
    // 将匹配的标签名存在 match中
    const match = {
        tagName:start[1],
        attrs: [],
    }
    // 将解析过后的 html删除
    advance(start[0].length);
    // 匹配的结束标签
    let end;
    // 匹配的属性
    let attr;
    // 匹配属性
    // 如果没有匹配到结束标签 && 匹配到属性 继续遍历
    // 反之，如果匹配到结束标签 || 不能匹配到属性 则结束遍历
    while(
        !(end = html.match(startTagClose)) && 
        (attr = html.match(dynamicArgAttribute) || html.match(attribute))
    ){
      advance(attr[0].length);
      match.attrs.push(attr);
    }
    if(end){
      advance(end[0].length)
      return match;
    }
  }

```

使用parseStartTag函数来解析开始标签以及对应的属性。

最终生成一个 match对象。

然后调用 options.start 将该对象传入。

再在parse/index.js的 start回调中设置 ast。

### 4.3.7 parse模块处理开始标签

上问我们说到在 html-parser模块处理完开始标签后就会调用 options.start 进行回调传入解析完的属性。
#### 4.3.7.1 currentParent

定义 currentParent 用来记录当前正在解析的父元素。

该变量存在有几点重要的意义。

1. 跟踪父元素：

在构建AST的过程中，每当遇到一个开始标签（如```<div>```），就需要创建一个新的元素节点。

并将其作为当前正在解析的父元素子节点。

通过设置 currentParent，可以确保新创建的元素节点能够正确地挂载到当前父节点上。

2. 构建层次关系：

HTML 文档是一个具有层次关系的结构，元素之间存在着父子关系。

currentParent 变量帮助我们在构建 AST 时正确地反映这种层次关系。

例如，当我们遇到一个嵌套的元素时，需要将新的元素添加到当前父元素的子节点列表中。

3. 方便恢复当前处理的父元素

每当进入一个新的开始标签时，currentParent 就会被更新为当前新创建的元素；

而当我们遇到一个结束标签时，需要恢复到上一个父元素。

#### 4.3.7.2 createASTElement

为了统一ast的格式，使用createASTElement函数来创建元素 AST。

元素 AST的 type为 1。

```js
export function createASTElement(
    tag,
    attrs,
    parent
){
    return {
        type:1,
        tag,
        attrList:attrs,
        parent
    }
}
```

#### 4.3.7.3 stack元素堆栈数组

在分析完开始元素后，将 currentParent设置为当前处理的开始元素。

再将当前元素推入栈中。

那么栈顶元素实际上就是 currentParent，是不是属于重复定义呢？其实并不是。

* currentParent的作用

currentParent 主要用于记录当前正在解析的父元素。

每当解析到一个新的开始标签时，currentParent 会被更新为新创建的元素节点。

这样可以确保新创建的子节点能够正确地挂载到当前的父节点上。

* stack 的作用

stack 用于记录已经解析过的元素节点的顺序，从而在遇到结束标签时能够正确地回溯到对应的父节点。

它通过压入和弹出元素来维持当前解析的元素层次关系。

两者在功能上有所区别，但相互协作共同完成模板的解析任务。

stack 的使用使得模板解析更加健壮，能够正确处理嵌套的元素结构。

#### 4.3.7.4 具体处理开始元素

```js
parseHTML(template,{
        start:(startMatch)=>{
            // 当开始元素解析完毕 需要创建一个新的元素 ast节点
            const element = createASTElement(startMatch.tagName, startMatch.attrs, currentParent)
            // 如果没有根节点 设置根节点
            if(!rootAst){
                rootAst = element
            }
            // 将当前处理的父元素设置为当前处理的开始元素
            currentParent = element;
            // 将当前元素推入栈中
            stack.push(element);
        },
        end:()=>{},
        char:()=>{},
}); 
```
首先，创建开始标签对应的元素。

然后

