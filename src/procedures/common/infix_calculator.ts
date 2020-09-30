interface Operation {
  apply: (...args: (number | bigint)[]) => number | bigint;
  priority: number;
  arguments: number;
}

const operators = new Map<string, Operation>([
  [
    '+',
    {
      priority: 1,
      apply: (a, b) => Number(a) + Number(b),
      arguments: 2
    }
  ],
  [
    '-',
    {
      priority: 1,
      apply: (a, b) => Number(a) - Number(b),
      arguments: 2
    }
  ],
  [
    '*',
    {
      priority: 2,
      apply: (a, b) => Number(a) * Number(b),
      arguments: 2
    }
  ],
  [
    '/',
    {
      priority: 2,
      apply: (a, b) => Number(a) / Number(b),
      arguments: 2
    }
  ],
  [
    '~',
    {
      //negation
      priority: 3,
      apply: x => -x,
      arguments: 1
    }
  ],

  [
    '^',
    {
      priority: 4,
      apply: (b, p) => Math.pow(<number>b, <number>p),
      arguments: 2
    }
  ],

  [
    '!',
    {
      priority: 5,
      apply: function (n) {
        //factorial
        let out: bigint = BigInt(1);
        for (let i = 2; i <= n; i++) out *= BigInt(i);
        return out;
        //return n > 1 ? n*this.apply(n-1) : 1;
      },
      arguments: 1
    }
  ]
]);

//NOTE: functions names should be 3 letters long
const functions = new Map<string, Operation>([
  [
    'sin',
    {
      priority: 6,
      apply: a => Math.sin((<number>a / 180.0) * Math.PI),
      arguments: 1
    }
  ],
  [
    'cos',
    {
      priority: 6,
      apply: a => Math.cos((<number>a / 180.0) * Math.PI),
      arguments: 1
    }
  ],
  [
    'tan',
    {
      priority: 6,
      apply: a => Math.tan((<number>a / 180.0) * Math.PI),
      arguments: 1
    }
  ]
]);

function extractNumber(str: string, start_i: number) {
  let out = '';
  let index = start_i;

  while (index < str.length && (str[index] === '.' || str[index] === ',' || !isNaN(parseInt(str[index])))) {
    out += str[index];
    index++;
  }

  return out.replace(/,/g, '.');
}

function convertInfixToPostfix(expression: string) {
  expression = expression.replace(/[\[{]/g, '(').replace(/[\]}]/g, ')').replace(/\s/g, '');

  const infix: (string | number | Operation)[] = []; //variables, numbers or operators
  for (let i = 0; i < expression.length; i++) {
    let prev_operator: Operation | undefined;
    const found_operator = operators.get(expression[i]);
    const found_func = functions.get(expression.substr(i, 3));

    if (
      expression[i] === '-' &&
      (i === 0 ||
        expression[i - 1] === '(' ||
        (!!(prev_operator = operators.get(expression[i - 1])) && prev_operator.priority < 4))
    ) {
      infix.push(<Operation>operators.get('~'));
    } else if (found_operator) {
      infix.push(found_operator);
    } else if (!isNaN(parseInt(expression[i]))) {
      const num = extractNumber(expression, i);
      i += num.length - 1;
      infix.push(parseFloat(num));
    } else if (found_func) {
      // console.log('found func:', found_func);
      infix.push(found_func);
    } else infix.push(expression[i]);
  }
  infix.push(')');

  //console.log('infix:', infix);

  const stack: ('(' | ')' | Operation)[] = ['('];
  const postfix: (number | Operation)[] = [];

  let index = 0;
  while (stack.length > 0) {
    if (index >= infix.length) {
      console.warn('Incorrect infix expression');
      break;
    }

    const element = infix[index];
    if (typeof element === 'number') postfix.push(<number>infix[index]);
    else if (typeof element === 'string') {
      if (element === '(') stack.push(element);
      else if (element === ')') {
        while (stack[stack.length - 1] !== '(') postfix.push(<Operation>stack.pop());
        stack.pop(); //removes left parenthesis
      }
    } else if (typeof element === 'object') {
      //Operator
      const op = <Operation>infix[index];

      while (
        typeof stack[stack.length - 1] === 'object' &&
        (<Operation>stack[stack.length - 1]).priority >= op.priority
      )
        postfix.push(<Operation>stack.pop());

      stack.push(op);
    }

    index++;
  }
  //console.log('postfix:', postfix);

  return postfix;
}

function calculatePostfix(postfix: (number | Operation)[]) {
  const stack: (number | bigint)[] = [];
  for (const element of postfix) {
    if (typeof element !== 'object')
      //number
      stack.push(element);
    else {
      //console.log( element.arguments );

      //pop last n elements from stack where n = element.arguments
      const args = stack.splice(stack.length - element.arguments, element.arguments);
      //let b = <number>stack.pop();
      //let a = <number>stack.pop();
      stack.push(element.apply(...args));
    }
  }
  if (stack.length !== 1) {
    console.error('Incorrect postfix data');
    return NaN;
  }
  return stack[0];
}

export function calculateInfix(expression: string) {
  return calculatePostfix(convertInfixToPostfix(expression));
}
