 
import { parse } from "./parse";

export const createCompiler = () => {
    return {
        compileToFunctions:(template, options, vm)=>{
            // 1.生成AST
            const ast = parse(template.trim(), options);
            // // 2.AST生成 render
            // const render = generate(ast, options);
            // return {
            //     render
            // }
        }
    }
}
  