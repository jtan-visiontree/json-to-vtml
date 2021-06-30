#!/usr/bin/env node

const args = process.argv.slice( 2 );

if ( args.length === 0 ) {
  process.exit();
}

// TODO: refactor to handle multiple files

const path = args[ 0 ];
const fs = require( 'fs' );
const jsontovtml = require( './lib/build' );

// Check if file exists
if ( !fs.existsSync( path ) ) {
  console.log( `${ path } does not exist.` );
  process.exit();
}

// Convert to JSON
let fileContent = fs.readFileSync( path, 'utf-8' );
let fileStructure = [];
try {
  fileStructure = JSON.parse( fileContent );
} catch( e ) {
  console.log( `${ path } is not a valid JSON file.` );
  process.exit();
}

// Save
jsontovtml.build( fileStructure ).then( template => {

  // Save at the same directory and filename
  let newVTMLTemplate = `${path.substring( 0, path.lastIndexOf( '.' ) )}.vtml`;
  fs.writeFile( newVTMLTemplate, template, ( error ) => {

    if ( error ) {
      console.error( error );
      return;
    }

    console.log( `Done. Saved to ${ newVTMLTemplate }.\n` );

  } )

} );
