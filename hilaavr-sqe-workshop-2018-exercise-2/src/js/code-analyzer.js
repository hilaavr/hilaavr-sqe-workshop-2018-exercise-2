import * as esprima from 'esprima';
import * as escodegen from 'escodegen';


export {symbolicSubstitution, index_if_line, eval_lines};

// --- global variables ---//
let listOfRows = [];
var Map = require('es6-map');
var rootMap = new Map();
var globalMap = new Map();
var scope = {rMap: rootMap, gMap: globalMap};
var pcJson;
let arguments_list=[];
let vars_to_present = [];
let eval_lines =[];
let index_if_line = [];

// --- main function --- //
const symbolicSubstitution = (codeToParse, args_list) => {
    handle_args_list(args_list);
    symbolicSubstitute(codeToParse);
    let output = escodegen.generate(pcJson);
    getIndexLineOfIfStatement(output);
    //console.log(output);
    return output;
};


//The function prepares a list in which each object matches a table row
const symbolicSubstitute = (codeToParse) => {
    listOfRows = []; //init the list of objects
    let relevantOutput = [];
    pcJson = esprima.parseScript(codeToParse,{loc:true});
    for (var i = 0; i<pcJson.body.length; i++) {
        pcJson.body[i] = parseByType(pcJson.body[i], scope);
        if(checkExpressionVariablesToPresent(pcJson.body[i])){
            relevantOutput.push(pcJson.body[i]);
        }
    }
    pcJson.body = relevantOutput;
    //parse again for colors
    for (var j = 0; j<pcJson.body.length; j++) {
        pcJson.body[j] = parseForColorsByType(pcJson.body[j], scope);
    }
    return listOfRows;
};


// --- main parsing by type --- //

function handle_args_list(args_list){
    arguments_list = args_list.split(', ');
}

function parseByType(pcJson,scope) {
    return parseHandler[pcJson.type](pcJson, scope);
}

function parseForColorsByType(pcJson,scope) {
    return parseColors[pcJson.type](pcJson, scope);
}

const parseHandler=
    {   'FunctionDeclaration': handleFuncDeclaration,
        'BlockStatement': handleBlockStatement,
        'VariableDeclaration': handleVarDeclaration,
        'AssignmentExpression': handleAssignmentExp,
        'WhileStatement': handleWhileStatement,
        'ExpressionStatement': handleExpStatement,
        'IfStatement': handleIfStatement,
        'ReturnStatement': handleRetStatement,
        'ForStatement': handleForStatement,
        'UpdateExpression': handleUpdateExp
    };

const parseColors =
    {   'FunctionDeclaration': handleFuncDeclarationColor,
        'BlockStatement': handleBlockStatementColor,
        'VariableDeclaration': handleVarDeclarationColor,
        'AssignmentExpression': handleAssignmentExpColor,
        'WhileStatement': handleWhileStatementColor,
        'ExpressionStatement': handleExpStatementColor,
        'IfStatement': handleIfStatementColor,
        'ReturnStatement': handleRetStatementColor,
        'ForStatement': handleForStatementColor,
        'UpdateExpression': handleUpdateExpColor
    };



// --- handle functions --- //

function handleFuncDeclaration(pcJson, scope){
    vars_to_present = [];
    for (var i = 0; i < pcJson.params.length; i++) {
        scope.gMap.set(pcJson.params[i].name, arguments_list[i]);
        vars_to_present.push(escodegen.generate(pcJson.params[i]));
    }
    pcJson.body = parseByType(pcJson.body, scope);
    return pcJson;
}

function handleVarDeclaration(pcJson, scope) {// Let Statement
    for (var i = 0; i < pcJson.declarations.length; i++) {
        let name = pcJson.declarations[i].id.name;
        let value = calculateExpression(pcJson.declarations[i].init, scope);
        scope.rMap.set(name, value);
    }
    return pcJson;
}

function handleAssignmentExp(pcJson, scope){
    let name = pcJson.left.name;
    let value = calculateExpression(pcJson.right, scope);
    scope.rMap.set(name, value);
    pcJson.right = (esprima.parse(value)).body[0].expression;
    return pcJson;
}

function handleBlockStatement(pcJson, scope){
    let relevantOutput = [];
    for (var i = 0; i < pcJson.body.length; i++) {
        pcJson.body[i] = parseByType(pcJson.body[i], scope);
        if(checkExpressionVariablesToPresent(pcJson.body[i])){
            relevantOutput.push(pcJson.body[i]);
        }
    }
    pcJson.body = relevantOutput;
    return pcJson;
}

function handleWhileStatement(pcJson, scope){
    let clonedScope = cloneScope(scope);
    let condition = calculateExpression(pcJson.test, clonedScope);
    pcJson.body = parseByType(pcJson.body, cloneScope(scope));
    pcJson.test = (esprima.parse(condition)).body[0].expression;
    return pcJson;

}

function handleExpStatement(pcJson, scope){

    if (pcJson.expression.type == 'AssignmentExpression')
        pcJson.expression = handleAssignmentExp(pcJson.expression, scope);
    else if (pcJson.expression.type == 'UpdateExpression')
        pcJson.expression = handleUpdateExp(pcJson.expression, scope);
    return pcJson;
}

function handleIfStatement(pcJson, scope){
    let clonedScope = cloneScope(scope);
    let condition = calculateExpression(pcJson.test, clonedScope);
    pcJson.test = (esprima.parse(condition)).body[0].expression;
    pcJson.consequent = parseByType(pcJson.consequent, clonedScope);

    if (pcJson.alternate == null)
        return pcJson;
    else if (pcJson.alternate.type == 'IfStatement')//elseIf
    {
        pcJson.alternate = handleIfStatement(pcJson.alternate, scope);
        return pcJson;
    }
    else {
        pcJson.alternate = parseByType(pcJson.alternate, scope);//else
        return pcJson;
    }
}

function handleRetStatement(pcJson, scope){
    let value = calculateExpression(pcJson.argument, scope);
    if (pcJson.argument!= null)
        pcJson.argument = (esprima.parse(value).body[0].expression);
    return pcJson;
}

function handleForStatement(pcJson, scope){
    if (pcJson.init != null)
        pcJson.init = parseByType(pcJson.init, scope);
    if (pcJson.update != null)
        pcJson.update = parseByType(pcJson.update, scope); // TODO - check if clone is needed
    pcJson.body = parseByType(pcJson.body, scope);
    return pcJson;
}

function handleUpdateExp(pcJson, scope) {// TODO - looks that the method do nothing
    let name = calculateExpression(pcJson.argument, scope);
    let value = calculateExpression(pcJson.argument, scope)+ pcJson.operator;
    scope.rMap.set(name, value);
    return pcJson;
}


// --- colors handlers --- //

function handleFuncDeclarationColor(pcJson,scope){
    pcJson.body = parseForColorsByType(pcJson.body, scope);
    return pcJson;
}

function handleBlockStatementColor(pcJson, scope){
    for (var i = 0; i < pcJson.body.length; i++) {
        pcJson.body[i] = parseForColorsByType(pcJson.body[i], scope);
    }
    return pcJson;
}

// eslint-disable-next-line no-unused-vars
function handleVarDeclarationColor(pcJson, scope) {// Let Statement
    return pcJson;
}

// eslint-disable-next-line no-unused-vars
function handleAssignmentExpColor(pcJson, scope){
    return pcJson;
}

function handleWhileStatementColor(pcJson, scope){
    pcJson.body = parseForColorsByType(pcJson.body, cloneScope(scope));
    return pcJson;
}

function handleExpStatementColor(pcJson, scope){//check if case AssignmentExpression
    pcJson.expression = handleAssignmentExpColor(pcJson.expression, scope);
    return pcJson;
}

// eslint-disable-next-line no-unused-vars
function handleRetStatementColor(pcJson, scope){
    return pcJson;
}

function handleForStatementColor(pcJson, scope){
    let clonedScope = cloneScope(scope);

    if (pcJson.init != null)
        pcJson.init = parseForColorsByType(pcJson.init, scope);
    if (pcJson.update != null)
        pcJson.update = handleUpdateExpColor(pcJson.update, clonedScope);
    pcJson.body = parseForColorsByType(pcJson.body, clonedScope);
    return pcJson;
}

// eslint-disable-next-line no-unused-vars
function handleUpdateExpColor(pcJson, scope) {
    return pcJson;
}

function handleIfStatementColor(pcJson, scope) {
    let expr_to_value = escodegen.generate(pcJson.test);
    if (evaluateExpression(expr_to_value, scope))
        eval_lines.push(true);
    else eval_lines.push(false);

    pcJson.consequent = parseForColorsByType(pcJson.consequent, cloneScope(scope));

    if (pcJson.alternate == null)
        return pcJson;
    else if (pcJson.alternate.type == 'IfStatement')//elseIf
    {
        pcJson.alternate = handleIfStatementColor(pcJson.alternate, scope);
        return pcJson;
    } else {
        pcJson.alternate = parseForColorsByType(pcJson.alternate, scope);//else
        return pcJson;
    }
}




// --- calculate expressions --- //

function calculateExpression(pcJson, scope){
    if (pcJson==null)
        return null;
    else {
        return calculateExpressionByType(pcJson, scope);
    }
}

function calculateExpressionByType(pcJson, scope){
    switch (pcJson.type) {
    case 'BinaryExpression':
        return calculateBinaryExp(pcJson, scope);
    case 'MemberExpression':
        return calculateMemberExp(pcJson, scope);
    case 'UnaryExpression':
        return calculateUnaryExp(pcJson, scope);
    case 'ArrayExpression':
        return calculateArrayExp(pcJson, scope);
    default:
        return calculateSimpleExp(pcJson, scope);
    }
}

function calculateSimpleExp(pcJson, scope){
    if (pcJson.type == 'Literal')
        return pcJson.raw;
    else{//(pcJson.type == 'Identifier')
        if ((scope.rMap.has(pcJson.name))&&!vars_to_present.includes(pcJson.name)) {
            return scope.rMap.get((pcJson.name));
        }
        return pcJson.name;
    }
}

function calculateArrayExp(pcJson, scope) {
    let i = 0;
    let ans = '[';
    for(i = 0;i < pcJson.elements.length-1;i++){
        ans = ans + calculateExpression(pcJson.elements[i], scope) + ',';
    }
    return ans + calculateExpression(pcJson.elements[i], scope) + ']';
}

function calculateBinaryExp(pcJson, scope){
    return (calculateExpression(pcJson.left, scope) +' '+ pcJson.operator + ' '+ calculateExpression(pcJson.right, scope));
}

function calculateMemberExp(pcJson, scope){
    let index = calculateExpression(pcJson.property,scope);
    let name = pcJson.object.name;//'a'
    if (!vars_to_present.includes(name))
        index = evaluateExpression(index, scope);

    let attribute;
    if (scope.rMap.has(name)) {
        attribute = scope.rMap.get((name));//2
    } else if (scope.gMap.has(name)) {
        attribute = scope.gMap.get((name));
    }
    let subAttribute = attribute.substr(1, attribute.length-2);
    let exp_array = subAttribute.split(',');
    return exp_array[index];
}

function calculateUnaryExp(pcJson, scope){
    return (pcJson.operator + calculateExpression(pcJson.argument, scope));
}



// --- Evaluate --- //

function evaluateExpression (expr_to_value, scope){

    for (var i=0; i<vars_to_present.length; i++)
    {   let arg_value;
        if (expr_to_value.includes(vars_to_present[i]))
        {
            arg_value = scope.gMap.get(vars_to_present[i]);
            expr_to_value = replace_args_with_value(expr_to_value, vars_to_present[i], arg_value);//arg_value= obj exp
        }
    }
    return eval(expr_to_value);
}



// --- helpers functions --- //

function replace_args_with_value(expr_to_value, arg_name, arg_value){
    let expr_array = expr_to_value.split(' ');
    for(var i = 0; i< expr_array.length; i++){
        if(expr_array[i] === arg_name){
            expr_array[i] = arg_value;
        }
    }
    return expr_array.join(' ');
}

function checkExpressionVariablesToPresent(pcJson){
    let bool = true;
    if (pcJson.type === 'ExpressionStatement') {//assignment or vardeclaration
        bool = checkExpressionVariablesToPresent(pcJson.expression);
    }
    else bool = checkVariablesToPresent(pcJson);
    return bool;
}

function checkVariablesToPresent(pcJson) {
    let bool = true;
    if (pcJson.type === 'VariableDeclaration'){
        if(!vars_to_present.includes(escodegen.generate(pcJson.declarations[0])))
            bool = false;
    }
    if (pcJson.type === 'AssignmentExpression') {
        if (!vars_to_present.includes(escodegen.generate(pcJson.left))) {
            bool = false;
        }
    }
    return bool;
}

function getIndexLineOfIfStatement(pcJson){
    let output = pcJson.split('\n');
    for(var i = 0;i < output.length;i++){
        if(output[i].indexOf('if')>=0){
            index_if_line.push(i);
        }
    }
}

function cloneScope(scope){
    var clonedRMap = new Map(scope.rMap);
    var clonedGMap = new Map(scope.gMap);
    var clonedScope = {rMap: clonedRMap,gMap:clonedGMap};
    return clonedScope;
}

