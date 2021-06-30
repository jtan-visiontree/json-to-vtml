#!/usr/bin/env node

const ARGS = process.argv.slice( 2 );
const WORKDIR = `${ process.env.HOME }/Werq/VisionTree`;
const PATHS = {
	masterFormsList: `${ WORKDIR }/master-forms-list`,
	spanishTranslation: `${ WORKDIR }/json-to-vtml/datasets/Translations/Spanish`
};
const FS = require( 'fs' );
const PATH = require( 'path' );
let exitCode = 0;
let dryRun = ARGS.includes( '--dry-run' );

async function rmrf ( directory ) {

	if ( FS.existsSync( directory ) ) {
		let files = FS.readdirSync( directory );

		for ( let file of files ) {
			let fileName = PATH.join( directory, file );
			let fileStat = FS.statSync( fileName );

			if ( fileName === '.' || fileName === '..') {

			} else if ( fileStat.isDirectory() ) {
				await rmrf( fileName );
			} else {
				FS.unlinkSync( fileName );
			}
		}

		FS.rmdirSync( directory );
	}

};

async function deleteAction( directory ) {

	if ( !dryRun ) {
		await rmrf( directory );
		console.log( `DELETED: "${ directory }"` );
	} else {
		console.log( `WAS GOING TO DELETE (Dry Run): "${ directory }"` );
	}

}

FS.readdir( PATHS.spanishTranslation, async ( err, files ) => {

	if ( !err ) {
		for ( let file of files ) {
			let fileName = `${ PATH.parse( file ).name }`;
			let directory = `${ PATHS.masterFormsList }/${ fileName }`

			if ( FS.existsSync( directory ) ) {
				await deleteAction( directory );
			} else {
				// Try trimming?
				directory = directory.trim();
				if ( FS.existsSync( directory ) ) {
					await deleteAction( directory );
				} else {
					console.log( `SKIPPING: "${ directory }" does not exist.` );
				}
			}

		}
	} else {
		exitCode = 1
	}

	process.exit( exitCode );

} );
