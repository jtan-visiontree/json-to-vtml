#!/usr/bin/env node

const args = process.argv.slice( 2 );

if ( args.length === 0 ) {
  process.exit();
}

// TODO: refactor to handle multiple files

const fs = require( 'fs' );
const path = require( 'path' );
const target = args[ 0 ];
const jsontovtml = require( './lib/build' );
const pretty = require( 'pretty' )

// Check if file exists
if ( !fs.existsSync( target ) ) {
  console.log( `${ target } does not exist.` );
  process.exit();
}

// Convert to JSON
let fileContent = fs.readFileSync( target, 'utf-8' );
let fileStructure = [];
try {
  fileStructure = JSON.parse( fileContent );
} catch( e ) {
  console.log( `${ target } is not a valid JSON file.` );
  process.exit();
}
let fileName = path.basename( target );
fileName = fileName.substring( 0, fileName.lastIndexOf( '.' ) );

let index = 1;

let promiseCatTemplate = [
  {
    "layout": "promis-cat-style1",
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

  for ( let element of item.Elements ) {
    if ( !element.hasOwnProperty( 'Map' ) ) {
      if ( itemData.sections.question === '' ) {
        if ( element.Description.charAt( element.Description.length - 1 ) === ',' ) {
          element.Description = element.Description.substring( 0, element.Description.length - 1 )
        }
        itemData.sections.question = element.Description;
      } else {
        let compoundedQuestion = [ itemData.sections.question, element.Description ];
        itemData.sections.question = {
          "layout": "basic-question",
          "sections": {
            "index": index.toString(),
            "question": compoundedQuestion.join( ', ' )
          }
        };
      }
    } else {
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
    "form-name": fileName,
    "answer-uid-map": JSON.stringify( answerUIDMap )
  }
});

//console.log( promiseCatTemplate );

jsontovtml.build( promiseCatTemplate ).then( template => {

  let beautifiedTemplate = pretty( template );

  // Save at the same directory and filename
  let newVTMLTemplate = `${target.substring( 0, target.lastIndexOf( '.' ) )}.vtml`;
  fs.writeFile( newVTMLTemplate, beautifiedTemplate, ( error ) => {

    if ( error ) {
      console.error( error );
      return;
    }

    console.log( `Done. Saved to ${ newVTMLTemplate }.\n` );

  } )

} );
