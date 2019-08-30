import {ProcedureBase, RESULT_TYPE, ResultSchema} from "./procedure_base";
import {calculateInfix} from "./common/infix_calculator";

interface OperationSchema {
	symbol: string;
}

const operations: {[index: string]: OperationSchema} = {
	add: {
		symbol: '+'
	},
	subtract: {
		symbol: '-'
	},
	multiply: {
		symbol: '*'
	},
	divide: {
		symbol: '/'
	},
	power: {
		symbol: '^'
	},
	factorial: {
		symbol: '!'
	},
	sinus: {
		symbol: 'sin'
	},
	cosinus: {
		symbol: 'cos'
	},
	tangent: {
		symbol: 'tan'
	}
};

function escapeRegExp(str: string) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const keywords_replacements = new Map<string, ((input: string) => string) | RegExp[]>([
	//replace operation names
	[ operations.add.symbol,        [/plus/, /doda[cć]/]            ],
	[ operations.subtract.symbol,   [/minus/, /odj[aą][cć]/]        ],
	[ operations.multiply.symbol,   [/razy/, /x/]                   ],
	[ operations.divide.symbol,     [/podzieli[cć] (na|przez)?/]    ],
	[ operations.factorial.symbol,  [/silnia/]                      ],
	[ operations.power.symbol,      (input) => {
		let match = input.match(/do ([^ ]+) pot[eę]gi/);
		if(match) {
			let i = match.index || 0;
			return input.substring(0, i) + operations.power.symbol + match[1] + input.substr(i + match[0].length);
		}
		return input;
	}                                                               ],
	[ operations.power.symbol+'2',  [/(do)? kwadratu?/]             ],
	[ operations.power.symbol+'3',  [/(do)? sze[sś]cianu?/]         ],
	[ operations.cosinus.symbol,      (input) => {
		let match = input.match(/cosinus (\d+[.,]?\d*) stopni/);
		return match ? `${input.substring(0, match.index)} cos(${match[1]}) ${
			input.substr((match.index||0)+match[0].length)}` : input;
	}                                                               ],
	[ operations.sinus.symbol,      (input) => {//sinus must be after cosinus because word "cosinus" contains "sinus"
		let match = input.match(/sinus (\d+[.,]?\d*) stopni/);
		return match ? `${input.substring(0, match.index)} sin(${match[1]}) ${
			input.substr((match.index||0)+match[0].length)}` : input;
	}                                                               ],
	[ operations.tangent.symbol,      (input) => {
		let match = input.match(/tangens (\d+[.,]?\d*) stopni/);
		return match ? `${input.substring(0, match.index)} tan(${match[1]}) ${
			input.substr((match.index||0)+match[0].length)}` : input;
	}                                                               ],
	
	//replace numbers
	[ '0', [/zero/, /zerowej/]                  ],
	[ '1', [/jeden/, /pierwszej/]               ],
	[ '2', [/dwa/, /drugiej/]                   ],
	[ '3', [/trzy/, /trzeciej/]                 ],
	[ '4', [/cztery/, /czwartej/]               ],
	[ '5', [/pi[eę][cć]/, /pi[aą]tej/]          ],
	[ '6', [/sze[sś][cć]/, /sz[oó]stej/]        ],
	[ '7', [/siedem/, /si[oó]dmej/]             ],
	[ '8', [/osiem/, /[oó]smej/]                ],
	[ '9', [/dziewi[eę][cć]/, /dziewi[aą]tej/]  ],
	[ '10', [/dziesi[eę][cć]/, /dziesi[aą]tej/] ],
]);

export class Calculate extends ProcedureBase {
	static readonly regexp = /^oblicz ([a-z]+ )?\d+[.,]?\d*/i;
	
	constructor(results: ResultSchema[]) {
		super(results);
		this.update(results);
	}
	
	private static isMathCommand(text: string) {
		let noSpace = text.replace(/\s/g, '');
		return noSpace.match(/\d+[.,]?\d*/i);
	}
	
	update(results: ResultSchema[]) {
		if( results.some(res => res.type === RESULT_TYPE.INTERIM) )//process only final or alternative results
			return;

		//get most confident sentence that is math command
		let equation_sentence = results.filter(res => Calculate.isMathCommand(res.result))
			.sort((r1, r2) => r2.confidence - r1.confidence)[0];
		if(!equation_sentence)
			return;
		
		let formatted_sentence = equation_sentence.result;//.replace(/\s/g, '');

		for(let [replacement, search_regexp] of keywords_replacements.entries()) {
			if( typeof search_regexp === 'function' )
				formatted_sentence = search_regexp(formatted_sentence);
			else {
				for (let regexp of search_regexp)
					formatted_sentence = formatted_sentence.replace(new RegExp(regexp, 'gi'), replacement);
			}
		}
		
		//clean
		const operation_symbols: string[] = Object.values(operations).map(op => escapeRegExp(op.symbol));
		//console.log(operation_symbols);
		const symbols_regexp = new RegExp([/\d+[.,]?\d*/.source, /\(/.source, /\)/.source, ...operation_symbols]
			.join('|'), 'gi');
		//console.log('test', symbols_regexp);
		formatted_sentence = (formatted_sentence.match(symbols_regexp) || []).join('');
		
		let result = calculateInfix(formatted_sentence);
		let equation = formatted_sentence + ' = ' + result;
		
		console.log(equation);
		
		this.notification = {
			content: equation
		};
		this.answer = {
			message: equation,
			loud: true,
			loud_message: equation_sentence.result.replace(/^oblicz/, '') + ' = ' + result
		};
		this.finished = true;
	}
}

/*(() => {//tests
	let samples = [
		'oblicz 30 silnia',
		'oblicz 5 plus 2 razy 3 - 7',
		'oblicz 5.28 kwadrat dodać 4,5 do sześcianu podzielić przez trzy do drugiej potęgi',
		'Oblicz sinus 69 stopni kwadrat dodać cosinus 69 stopni kwadrat',
		'oblicz 5 silnia minus 2'
	];
	for(let s of samples) {
		let procedure = new Calculate([{result: s, type: RESULT_TYPE.FINAL, confidence: 1}]);
		if( !procedure.isFinished() )
			console.error('Test not passed for sentence: ' + s);
	}
})();*/