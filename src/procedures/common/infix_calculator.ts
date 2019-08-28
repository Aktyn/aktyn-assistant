interface Operator {
	priority: number;
	apply(...args: number[]): number;
	arguments: number;
}

const operators = new Map<string, Operator>([
	['+', {
		priority: 1,
		apply: (a, b) => a+b,
		arguments: 2
	}],
	['-', {
		priority: 1,
		apply: (a, b) => {
			console.log('test', a,b);
			return a-b;
		},
		arguments: 2
	}],
	['*', {
		priority: 2,
		apply: (a, b) => a*b,
		arguments: 2
	}],
	['/', {
		priority: 2,
		apply: (a, b) => a/b,
		arguments: 2
	}],
	['~', {//negation
		priority: 3,
		apply: x => -x,
		arguments: 1
	}],
	
	['^', {
		priority: 4,
		apply: (a, b) => Math.pow(a, b),
		arguments: 2
	}],
	
	['!', {
		priority: 5,
		apply: function(n) {
			return n > 1 ? n*this.apply(n-1) : 1;
		},
		arguments: 1
	}],
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

function convertInfixToPostfix(expression: string) {
	expression = expression.replace(/[\[{]/g, '(')
		.replace(/[\]}]/g, ')').replace(/\s/g, '');
	
	let infix: (string | number | Operator)[] = [];//variables, numbers or operators
	for(let i=0; i<expression.length; i++) {
		let found_operand: Operator | undefined;
		if( expression[i] === '-' && (i===0 || expression[i-1] === '(' || operators.has(expression[i-1])) ) {
			infix.push( <Operator>operators.get('~') );
		}
		else if( (found_operand = operators.get(expression[i])) ) {
			infix.push(found_operand);
		}
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
	
	//console.log( 'infix:', infix );
	
	let stack: ('(' | ')' | Operator)[] = ['('];
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
			
			//if( op === operators.get('-') && (index === 0 || infix[index-1] === '(' || infix[in]) )
			
			while(typeof stack[stack.length-1] === 'object' && (<Operator>stack[stack.length-1]).priority >= op.priority)
				postfix.push( <Operator>stack.pop() );
			
			stack.push(op);
		}
		
		index++;
	}
	//console.log('postfix:', postfix);
	
	return postfix;
}

function calculatePostfix(postfix: (number | Operator)[]) {
	let stack: number[] = [];
	for(let element of postfix) {
		if( typeof element !== 'object' )//number
			stack.push( element );
		else {
			//console.log( element.arguments );
			
			//pop last n elements from stack where n = element.arguments
			let args = stack.splice(stack.length-element.arguments, element.arguments);
			//let b = <number>stack.pop();
			//let a = <number>stack.pop();
			stack.push( element.apply(...args) );
		}
	}
	if(stack.length !== 1) {
		console.error('Incorrect postfix data');
		return NaN;
	}
	return stack[0];
}

export function calculateInfix(expression: string) {
	return calculatePostfix( convertInfixToPostfix(expression) );
}