import $ from 'jquery';
import {symbolicSubstitution, index_if_line, eval_lines} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let args_list = $('#argsTextArea').val();
        let parsedCode = symbolicSubstitution(codeToParse, args_list);
        $('#parsedCode').html(printColorCode(parsedCode,index_if_line,eval_lines));
    });
});


function printColorCode(parsedCode,index_if_line,eval_lines){
    let output_arrayLines = parsedCode.split('\n');
    let output_index = 0;
    let output = '';
    for(var i = 0;i<output_arrayLines.length;i++){
        if(index_if_line.indexOf(i)<0) {//no color needed
            output += output_arrayLines[i] + '</br\n>';
        }
        else{
            if(!eval_lines[output_index]){
                output += '<p>' + '<redMark>' + output_arrayLines[i] + '</redMark>' + '</p>';
            }
            if(eval_lines[output_index]){
                output += '<p>' + '<greenMark>' + output_arrayLines[i] + '</greenMark>' + '</p>';
            }
            output_index++;
        }
    }
    return output;
}
