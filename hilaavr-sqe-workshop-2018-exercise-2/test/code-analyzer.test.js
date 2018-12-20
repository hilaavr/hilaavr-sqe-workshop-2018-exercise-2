import assert from 'assert';
import {symbolicSubstitution} from '../src/js/code-analyzer';



describe('f1', () => {

    it('test1: ', () => {
        assert.equal(
            symbolicSubstitution('function foo(x,y){\n' +
                '        let a = 1;\n' +
                '        if (a < x) {\n' +
                '            return a;\n' +
                '        } else return x;\n' +
                '\n' +
                '    }', '2, 3'),
            'function foo(x, y) {\n' +
            '    if (1 < x) {\n' +
            '        return 1;\n' +
            '    } else\n' +
            '        return x;\n' +
            '}');
    });
});


describe('f2', () => {

    it('test2: ', () => {
        assert.equal(
            symbolicSubstitution('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' + '    let b = a + y;\n' + '    let c = 0;\n' + '    \n' +
            '    if (b < z) {\n' + '        c = c + 5;\n' + '        return x + y + z + c;\n' +
            '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' + '        return x + y + z + c;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' + '        return x + y + z + c;\n' + '    }\n' +
            '}\n', '1, 2, 3'),'function foo(x, y, z) {\n' +
            '    if (x + 1 + y < z) {\n' +
            '        return x + y + z + 0 + 5;\n' +
            '    } else if (x + 1 + y < z * 2) {\n' +
            '        return x + y + z + 0 + x + 5;\n' +
            '    } else {\n' +
            '        return x + y + z + 0 + z + 5;\n' + '    }\n' +
            '}');
    });
});


describe('f3', () => {

    it('test3: ', () => {
        assert.equal(
            symbolicSubstitution('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' + '    let b = a + y;\n' +
                '    let c = 0;\n' + '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' + '        z = c * 2;\n' +  '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}\n','1, 2, 3')
            ,'function foo(x, y, z) {\n' +
            '    while (x + 1 < z) {\n' +
            '        z = x + 1 + x + 1 + y * 2;\n' +
            '    }\n' +
            '    return z;\n' +
            '}'
        );});
});

describe('f4', () => {

    it('test4: ', () => {
        assert.equal(
            symbolicSubstitution('function foo(x, y){\n' +
                '      let a = y + 1\n' +
                '      let b = a + y;\n' +
                '      let c = 0;\n' +
                '      \n' +
                '      if (a < x){\n' +
                'return z;\n' +
                '}\n' +
                '}', '[0], 4'),
            'function foo(x, y) {\n' +
            '    if (y + 1 < x) {\n' +
            '        return z;\n' +
            '    }\n' +
            '}');
    });
});

describe('f5', () => {

    it('test5: ', () => {
        assert.equal(
            symbolicSubstitution('function foo(x, y){\n' +
                '      let a = y + 1\n' +
                '      let b = a + y;\n' +
                '      let c = 0;\n' + '      \n' +
                '          for (let i =0; i<3;){\n' + 'x = y+1;\n' +
                '}\n' + '\n' +
                'return 0;\n' +
                '}', '1, 2, 3'),
            'function foo(x, y) {\n' +
            '    for (let i = 0; i < 3;) {\n' +
            '        x = y + 1;\n' +
            '    }\n' +
            '    return 0;\n' +
            '}');
    });
});

describe('f6', () => {
    it('test6: ', () => {
        assert.equal(
            symbolicSubstitution('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let c = 0;\n' +
                '\n' +
                '    for (let i = 2; i<10; i++){\n' +
                '        x = i;\n' +
                '    }\n' +
                '    return -1;\n' +
                '}','1, 2, 3'),
            'function foo(x, y, z) {\n' +
            '    for (let i = 2; i < 10; i++) {\n' +
            '        x = 2;\n' +
            '    }\n' +
            '    return -1;\n' +
            '}');
    });
});

describe('f7', () => {
    it('test7: ', () => {
        assert.equal(
            symbolicSubstitution('function foo(x, y){\n' +
                '    let a = [3];\n' +
                '    if (x>0){\n' +
                '        return 0;\n' +
                '    }\n' +
                '    return 1;\n' +
                '}','1, 2'),
            'function foo(x, y) {\n' +
            '    if (x > 0) {\n' +
            '        return 0;\n' +
            '    }\n' +
            '    return 1;\n' +
            '}');
    });
});

describe('f8', () => {
    it('test8: ', () => {
        assert.equal(
            symbolicSubstitution('function foo(x, y){\n' +
                '\n' +
                '    let a = [3];\n' +
                '    a[0]=x;\n' +
                '    if (y>0){\n' +
                '        return 0;\n' +
                '    }\n' +
                '    return 1;\n' +
                '}','1, 2'),
            'function foo(x, y) {\n' +
            '    if (y > 0) {\n' +
            '        return 0;\n' +
            '    }\n' +
            '    return 1;\n' +
            '}');
    });
});


describe('f9', () => {
    it('test9: ', () => {
        assert.equal(
            symbolicSubstitution('',''),
            '');
    });
});

describe('f10', () => {
    it('test10: ', () => {
        assert.equal(
            symbolicSubstitution('function foo(x, y){\n' +
                '    let c=x;\n' +
                '    if (c>0)\n' +
                '    {\n' +
                '        if (true) {\n' + '        return 0;\n' + '        }\n' +
                '    }\n' +
                '    return 1;\n' +
                '}','1, 2'),
            'function foo(x, y) {\n' +
            '    if (x > 0) {\n' +
            '        if (true) {\n' + '            return 0;\n' +
            '        }\n' +
            '    }\n' +
            '    return 1;\n' +
            '}');
    });
});

describe('f11', () => {
    it('test11: ', () => {
        assert.equal(
            symbolicSubstitution('function foo(x, y){\n' +
                'let a=x+1;\n' +
                'let b=[a, 7, x+5];\n' +
                '    if (a + 1 < y[1]) {\n' + '        return b[a];\n' +
                '    } else {\n' +
                '        return 10;\n' +
                '    }\n' +
                '}','0, [2,5]'),
            'function foo(x, y) {\n' +
            '    if (x + 1 + 1 < 5) {\n' +
            '        return 7;\n' +
            '    } else {\n' +
            '        return 10;\n' +
            '    }\n' +
            '}');
    });
});


describe('f12', () => {
    it('test12: ', () => {
        assert.equal(
            symbolicSubstitution('function foo(x, y){\n' +
                'let a=x+1;\n' +
                'let b=[a, 7, x+5];\n' +
                '    if (a + 1 < y[1]) {\n' + '        return b[x+1];\n' +
                '    } else {\n' + '        return 10;\n' +
                '    }\n' +
                '}','0, [2,5]'),
            'function foo(x, y) {\n' +
            '    if (x + 1 + 1 < 5) {\n' +
            '        return 7;\n' +
            '    } else {\n' +
            '        return 10;\n' +
            '    }\n' +
            '}');
    });
});


describe('f13 return null', () => {
    it('test13: ', () => {
        assert.equal(
            symbolicSubstitution('function foo(x){\n' +
                'let a=x+1;\n' +
                '    if (a + 1 < 8) {\n' +
                '        return;\n' +
                '    } else {\n' +
                '        return 5;\n' +
                '    }\n' +
                '}','0'),
            'function foo(x) {\n' +
            '    if (x + 1 + 1 < 8) {\n' +
            '        return;\n' +
            '    } else {\n' +
            '        return 5;\n' +
            '    }\n' +
            '}');
    });
});

describe('f14 updateExp', () => {
    it('test14: ', () => {
        assert.equal(
            symbolicSubstitution('function foo(x, y, z){\n' +
                '    let b = y;   \n' +
                'y++;\n' +
                'for (let i=0; i<5; i++) {\n' +
                'b = b+1;\n' +
                '}\n' +
                'return b;\n' +
                '}','1, 2, 3'),
            'function foo(x, y, z) {\n' +
            '    y++;\n' +
            '    for (let i = 0; i < 5; i++) {\n' +
            '    }\n' +
            '    return y + 1;\n' +
            '}');
    });
});