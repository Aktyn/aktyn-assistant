interface Operator {
	priority: number;
	apply(val1: number, val2: number): number;
}

const operands = new Map<string, Operator>([
	['+', {
		priority: 1,
		apply: (a, b) => a+b
	}],
	['-', {
		priority: 1,
		apply: (a, b) => a-b
	}],
	['*', {
		priority: 2,
		apply: (a, b) => a*b
	}],
	['/', {
		priority: 2,
		apply: (a, b) => a/b
	}],
	['^', {
		priority: 3,
		apply: (a, b) => Math.pow(a, b)
	}]
]);

function extractNumber(str: string, start_i: number) {
	let out = '';
	let index = start_i;
	
	while( index < str.length && (str[index] === '.' || str[index] === ',' || !isNaN(parseInt(str[index])) ) ) {
		out += str[index];
		index++;
	}
	
	return out.replace(/,/g, '.');
}

export function convertInfixToPostfix(expression: string) {
	expression = expression.replace(/[\[{]/g, '(')
		.replace(/[\]}]/g, ')');
	
	let stack: ('(' | ')' | Operator)[] = ['('];
	
	let infix: (string | number | Operator)[] = [];//variables, numbers or operators
	for(let i=0; i<expression.length; i++) {
		let found_operand: Operator | undefined;
		if( (found_operand = operands.get(expression[i])) )
			infix.push(found_operand);
		else if( !isNaN(parseInt(expression[i])) ) {
			let num = extractNumber( expression, i );
			i += num.length - 1;
			infix.push( parseFloat(num) );
		}
		else {//TODO: search for function
			
			//for now add bracelet symbol or any letter
			infix.push( expression[i] );
		}
	}
	infix.push(')');
	
	//console.log( infix );
	
	let postfix: (number | Operator)[] = [];
	
	let index = 0;
	while( stack.length > 0 ) {
		if( index >= infix.length ) {
			console.warn('Incorrect infix expression');
			break;
		}
		
		let element = infix[index];
		if(typeof element === 'number')
			postfix.push( <number>infix[index] );
		else if(typeof element === 'string') {
			if(element === '(')
				stack.push(element);
			else if(element === ')') {
				while( stack[stack.length-1] !== '(' )
					postfix.push( <Operator>stack.pop() );
				stack.pop();//removes left parenthesis
			}
		}
		else if(typeof element === 'object') {//Operator
			let op = <Operator>infix[index];
			
			while( typeof stack[stack.length-1] === 'object' && (<Operator>stack[stack.length-1]).priority >= op.priority )
				postfix.push( <Operator>stack.pop() );
			
			stack.push(op);
		}
		
		index++;
	}
	
	//postfix.reverse();
	return postfix;
}

export function calculatePostfix(postfix: (number | Operator)[]) {
	let stack: number[] = [];
	for(let element of postfix) {
		if( typeof element !== 'object' )
			stack.push( element );
		else {
			let b = <number>stack.pop();
			let a = <number>stack.pop();
			stack.push( element.apply(a, b) );
		}
	}
	if(stack.length !== 1) {
		console.error('Incorrect postfix data');
		return NaN;
	}
	return stack[0];
}