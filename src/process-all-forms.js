#!/usr/bin/env node

const ARGS = process.argv.slice( 2 );
const WORKDIR = `${ process.env.HOME }/Werq/VisionTree`;
const PATHS = {
	masterFormsList: `${ WORKDIR }/master-forms-list`,
	jsonFiles: `${ WORKDIR }/json-to-vtml/datasets/Forms`
};
/*
const PATHS = {
	masterFormsList: `${ WORKDIR }/json-to-vtml/test`,
	jsonFiles: `${ WORKDIR }/json-to-vtml/test`
};
*/
const JSONTOVTML = require( './lib/build' );
const FS = require( 'fs' );
const PATH = require( 'path' );
const PRETTY = require( 'pretty' )
let exitCode = 0;
let dryRun = ARGS.includes( '--dry-run' );
let processedFiles = {
	updated: [],
	skipped: []
};

let mapOldPaths = {
	paths: {},
	getPath: function( path ) {
		return path in this.paths ? this.paths[ path ] : '';
	},
	set newPath( path ) {
		this.paths[ `${ WORKDIR }/master-forms-list/${ path.old }` ] = `${ WORKDIR }/master-forms-list/${ path.new }`;
	}
};

mapOldPaths.newPath = {
	old: `PROMIS Bank v1.0 Alcohol: Alcohol Use`,
	new: `PROMIS Bank v1.0 Alcohol - Alcohol Use`
};
mapOldPaths.newPath = {
	old: `PROMIS Bank v1.0 Alcohol: Negative Consequences`,
	new: `PROMIS Bank v1.0 Alcohol - Negative Consequences`
};
mapOldPaths.newPath = {
	old: `PROMIS Bank v1.0 Alcohol: Negative Expectancies`,
	new: `PROMIS Bank v1.0 Alcohol - Negative Expectancies`
};
mapOldPaths.newPath = {
	old: `PROMIS Bank v1.0 Alcohol: Positive Consequences`,
	new: `PROMIS Bank v1.0 Alcohol - Positive Consequences`
};
mapOldPaths.newPath = {
	old: `PROMIS Bank v1.0 Alcohol: Positive Expectancies`,
	new: `PROMIS Bank v1.0 Alcohol - Positive Expectancies`
};
mapOldPaths.newPath = {
	old: `PROMIS Bank v1.0 - Self-Efficacy Manage Meds\\Tx`,
	new: `PROMIS Bank v1.0 - Self-Efficacy Manage Meds Tx`
};
mapOldPaths.newPath = {
	old: `PROMIS Bank v1.0 - Smoking Emot\\Sensory AllSmk`,
	new: `PROMIS Bank v1.0 - Smoking Emot Sensory AllSmk`
};
mapOldPaths.newPath = {
	old: `PROMIS Bank v1.0 - Smoking Emot\\Sensory Daily`,
	new: `PROMIS Bank v1.0 - Smoking Emot Sensory Daily`
};
mapOldPaths.newPath = {
	old: `PROMIS Bank v1.0 - Smoking Emot\\Sensory NonDaily`,
	new: `PROMIS Bank v1.0 - Smoking Emot Sensory NonDaily`
};

//console.log( mapOldPaths.paths );

async function buildTemplateFromJSON( target ) {

	// Convert to JSON
	let fileContent = FS.readFileSync( `${ PATHS.jsonFiles }/${ target }`, 'utf-8' );
	let fileStructure = [];
	try {
		fileStructure = JSON.parse( fileContent );
	} catch( e ) {
		console.log( `${ target } is not a valid JSON file.` );
		process.exit();
	}

	let index = 1;

	let promiseCatTemplate = [
		{
			"layout": "promis-cat-header1",
			"sections": {}
		},
		{
			"layout": "hidden-field",
			"sections": {
				"index": index.toString(),
				"class": "promis-cat-questions-answered",
				"label": "Internal Use Only. Preserves the position of answered question."
			},
		}
	];
	let answerUIDMap = {}
	index++;

	if ( !fileStructure.hasOwnProperty( 'Items' ) ) {
		console.log( 'No items found.' );
		process.exit();
	}

	for ( let item of fileStructure.Items ) {
		if ( !item.hasOwnProperty( 'Elements' ) ) {
			continue;
		}

		let itemData = {
			"layout": "promis-cat-panel1",
			"sections": {
				"FormItemOID": item.FormItemOID,
				"question": '',
				"answers": []
			}
		};
		answerUIDMap[ item.FormItemOID ] = {};
		let compoundedQuestion = [];

		for ( let element of item.Elements ) {
			if ( !element.hasOwnProperty( 'Map' ) ) {
				if ( compoundedQuestion.length !== 0 ) {
					if ( element.Description.charAt( element.Description.length - 1 ) === ',' ) {
						element.Description = element.Description.substring( 0, element.Description.length - 1 )
					}
					compoundedQuestion.push( element.Description );
				} else {
					compoundedQuestion.push( element.Description );
				}
			} else {
				itemData.sections.question = {
					"layout": "basic-question",
					"sections": {
						"index": index.toString(),
						"question": compoundedQuestion.join( ', ' )
					}
				};
				compoundedQuestion = [];

				let answers = [];
				for ( let answer of element.Map ) {
					answers.push( {
						"layout": "answer-list-radio-bootstrap1",
						"sections": {
							"index": index.toString(),
							"value": answer.Value,
							"description": answer.Description
						}
					} );
					answerUIDMap[ item.FormItemOID ][ answer.Value ] = answer.ItemResponseOID;
				}
				itemData.sections.answers = answers;
				index++;
			}
		}

		promiseCatTemplate.push( itemData );
	}

	promiseCatTemplate.push( {
		"layout": "promis-cat-results",
		"sections": {
			"t-score-index": ( index++ ).toString(),
			"confidence-interval-index": ( index ).toString()
		}
	} );

	promiseCatTemplate.push( {
		"layout": "promis-cat-wizard1",
		"sections": {
			"previous-question-label": "Previous Question",
			"next-question-label": "Next Question"
		}
	} );

	promiseCatTemplate.push( {
		"layout": "promis-cat-script1",
		"sections": {
			"form-name": target.substring( 0, target.lastIndexOf( '.' ) ),
			"answer-uid-map": JSON.stringify( answerUIDMap )
		}
	} );

	return promiseCatTemplate;

}

async function updateAction( jsonFile, directory ) {

	if ( !dryRun ) {
		let promiseCatTemplate = await buildTemplateFromJSON( jsonFile );
		await JSONTOVTML.build( promiseCatTemplate ).then( vtmlTemplate => {
			vtmlTemplate = PRETTY( vtmlTemplate );

			let files = FS.readdirSync( directory );
			for ( let file of files ) {
				FS.writeFileSync( `${ directory }/${ file }`, vtmlTemplate );
			}
			processedFiles.updated.push( directory );
		} );
	} else {
		processedFiles.updated.push( directory );
	}

}

FS.readdir( PATHS.jsonFiles, async ( err, files ) => {

	if ( !err ) {

		// Process only JSON files
		files = files.filter( file => {
			return PATH.extname( file ).toLowerCase() === '.json';
		} );

		for ( let file of files ) {
			let fileName = `${ PATH.parse( file ).name }`;
			let directory = `${ PATHS.masterFormsList }/${ fileName }`

			if ( FS.existsSync( directory ) ) {
				// If it exists, process it
				await updateAction( file, directory );
			} else {
				// Try trimming?
				if ( FS.existsSync( directory.trim() ) ) {
					await updateAction( file, directory.trim() );
				}
				// Or maybe it was one of the modified paths?
				else if ( FS.existsSync( mapOldPaths.getPath( directory ) ) ) {
					await updateAction( file, mapOldPaths.getPath( directory ) );
				} else {
					processedFiles.skipped.push( directory );
				}
			}
		}

		console.log( 'UPDATED:\n ', processedFiles.updated.join( '\n  ' ) );
		console.log( 'SKIPPED:\n ', processedFiles.skipped.join( '\n  ' ) );

	} else {
		exitCode = 1
	}

	process.exit( exitCode );

} );
