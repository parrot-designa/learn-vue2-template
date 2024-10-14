
import { parseHTML } from "./html-parser";

export function createASTElement(
    tag,
    attrs,
    parent
){
    return {
        type:1,
        tag,
        attrList:attrs,
        parent,
        children:[]
    }
}

export function parse(template){

    let rootAst;
    let currentParent;
    const stack = [];
    
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

    return rootAst;

}