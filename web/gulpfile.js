var gulp = require('gulp');



gulp.task('inject' , function(){
    
   // var wiredep = require('wiredep').stream;
    
    var inject = require('gulp-inject');
    
    var injectSrc = gulp.src(['app/*.js','./app/*/*.js'],{ read : false});
    
    var injectOptions = {
        ignorePath : '/public/'
    };
    
    var options = {
        directory: './public/lib',
        ignorePath: '../../public'
    };
    
    return gulp.src('*.html')
       .pipe(inject(injectSrc, { starttag: '<!-- inject:angular:js -->' })) 
    .pipe(gulp.dest('./'));
     
});

gulp.task('serve' , function(){
  
  gulp.watch('app/**/*.js', ['inject']);
   
  /* return nodemon(options)
   .on('restart' ,  function(ev){
       console.log('restarting...');
   });*/
});