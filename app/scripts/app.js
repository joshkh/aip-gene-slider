/*jshint camelcase: false*/
(function(window, $, undefined) {
  'use strict';

  console.log('Hello, workshop tutorial!');

  var appContext = $('[data-app-name="workshop-tutorial"]');

  // var templates = {
  //   resultTable: _.template('<table class="table"><thead><th>Related Locus</th><th>Direction</th><th>Score</th></thead><tbody><% _.each(result, function(r) { %><%= resultRow(r) %><% }); %></tbody></table>'),
  //   resultRow: _.template('<% for (var i = 0; i < relationships.length; i++) { %><tr><% if (i === 0) { %><td rowspan="<%= relationships.length %>"><%= related_entity %> <button type="button" class="btn btn-info" name="gene-report" data-locus="<%= related_entity %>"><i class="fa fa-book"></i><span class="sr-only">Get Gene Report</button></td><% } %><td><%= relationships[i].direction %></td><td><% _.each(relationships[i].scores, function(score){ %><%= _.values(score)[0] %><% }); %></td></tr><% } %>'),
  //   geneReport: _.template('<div class="modal fade"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" data-dismiss="modal" class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button><h4>Gene Report: <%= locus %></h4></div><div class="modal-body"><% _.each(properties, function(prop) { %><h3><%= prop.type.replace("_"," ") %></h3><p><%= prop.value %></p><% }) %></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div></div></div></div>')
  // };

  /*
   * ADAMA - Araport Data API Mediator API
   * getStatus()
   * getNamespaces()
   * getServices()
   * search()
   *
   * Data APIs
   * {'namespace': 'aip', 'service': 'atted_coexpressed_by_locus_v0.1'}
   * {'namespace': 'aip', 'service': 'locus_gene_report_v0.1'}
   */
  var form = $('form[name=workshop-tutorial-query]', appContext);
  form.on('submit', function(e) {
    e.preventDefault();

    var Agave = window.Agave;

    // clear error messages
    $('.messages', this).empty();
    $('.has-error', this).removeClass('has-error');

    var query = {
      locus: this.locus.value,
      before: this.before.value,
      after: this.after.value
    };

    console.log("query", query);

    // basic validate
    var hasError = false;
    if (! query.locus) {
      $(this.locus).parent().addClass('has-error');
      $('.messages', this).append('<div class="alert alert-danger">Locus is required</div>');
      hasError = true;
    }

    if (! query.threshold) {
      $(this.threshold).parent().addClass('has-error');
      $('.messages', this).append('<div class="alert alert-danger">Threshold is required</div>');
      hasError = true;
    } else if (! /(\d+\.)?\d+/.test(query.threshold)) {
      $(this.threshold).parent().addClass('has-error');
      $('.messages', this).append('<div class="alert alert-danger">Threshold must be numeric</div>');
      hasError = true;
    }

    if (! hasError) {
      $('.results').html('<pre><code>' + JSON.stringify(query, null, 2) + '</code></pre>');
    }

    Agave.api.adama.getStatus({}, function(resp) {
      if (resp.obj.status === 'success') {
        Agave.api.adama.search(
          {'namespace': 'aip', 'service': 'atted_coexpressed_by_locus_v0.1', 'queryParams': query},
          function(search) {
            $('.results', appContext).empty().html(templates.resultTable({
              result: search.obj.result,
              resultRow: templates.resultRow
            }));

            $('button[name=gene-report]', appContext).on('click', function(e) {
              e.preventDefault();
              var btn, locus;
              btn = $(this);
              locus = btn.attr('data-locus');

              Agave.api.adama.search(
                {'namespace': 'aip', 'service': 'locus_gene_report_v0.1', 'queryParams': {'locus': locus}},
                function(search) {
                  $(templates.geneReport(search.obj.result[0])).appendTo('body').modal();
                }
              );
            });

            $('.results table', appContext).dataTable({
              'order': [[ 2, 'desc' ]]
            });
          });
      } else {
        // ADAMA is not available, show a message
        $('.messages', this).append('<div class="alert alert-danger">The Query Service is currently unavailable. Please try again later.</div>');
      }
    });

  });


////////////////////////////////////////////////////////////////////////////////
// This is the javascript file for GeneSlider program
// Author: Asher
// Date: 2014
////////////////////////////////////////////////////////////////////////////////

// Global Variables
var pjs;  // Processing js object
var bound;  // If Processing is bound
var jsonClone;  // This will have data for gff
var search; // The JSON object for search

// Functions
// Bind processing
function bindjs() {
  pjs = Processing.getInstanceById('GeneSlider');
  if (pjs != null) {
    pjs.bindJavascript(this);
    bound = true;
  }
  if (!bound) { 
    setTimeout(bindjs, 250);
  }
}

// Load and example
function loadExample() {

  // Check processing
  if (!bound) {
    bindjs();
  }

  // Now get data using AJAX
  $.ajax({
    url: "../app/data/test.txt",
    async:false,
    cache:false,
    success:function(data) {
      // Now load the data
      pjs.resetData();
      pjs.setFastaData(data);
    },
  });
}

// This function check the validity of the fasta file.
// then be analized in JavaScript or Processing.
function checkFastaSeq(fileData) {
  // Variables
  var fileDataArray;  // This array will hold the data from the user file
  var seqLength;  // The length of sequences in the file

  // RegEx patterns
  var startPattern = /^>/;
  var digits = /\d/;
  // Special character * is now allowed
  var special = /\[|\]|\^|\$|\.|\||\?|\+|\(|\)|~|\`|\!|\@|\#|\%|\&|\_|\+|\=|\{|\}|\'|\"|\<|\>|\:|\;|\,/;
  // Sequence X is allow allowed!
  var seq = /b|j|o|u|z/i;

  // Converts big string into arrays
  fileDataArray = fileData.split("\n");

  // Checks for ">" in the first line first sentence
  if (!(startPattern.test(fileDataArray[0]))) {
    alert("This is not a FASTA file.");
    return false;
  }

  // Check for number of lines
  if (fileDataArray.length <= 2) {
    alert("Atleast 2 seqeunces are needed.");
    return false;
  }
  
  // Check for sequence lengths
  // lengths of all sequences must be the same
  seqLength = fileDataArray[1].length;  // Get the length of the first sequence
  for (var i=0; i < fileDataArray.length - 1; i++) {
    if (!(startPattern.test(fileDataArray[i]))) {
      // Get the length of the sequence and check it against the length of first sequence
      var length = fileDataArray[i].length;
      if (length != seqLength) {
        alert("The lengths of the sequences are not equal.");
        return false;
      }

      // Check for digits
      if (digits.test(fileDataArray[i])) {
        alert("The sequences should not have digits.");
        return false;
      }

      // Check for DNA/Protein Sequence
      if (seq.test(fileDataArray[i])) {
        alert("The file has non DNA/Protein sequence.");  
        return false;
      }
    }
  }
  
  // All tests passed
  return true;
}

// Read file from user
function readFile(evt) {
  var file = evt.files[0];

  // Check Processing
  if (!bound) {
    bindjs();
  }

  // Load the user supplied file
  if (file) {
    var inputFile = new FileReader();
    var contents; // The contents of the file as one big string
    
    inputFile.onload = function(e) {
      contents = e.target.result; // Get the file contents

      // Fix FASTA files with multiple lines
      var components = contents.split('>');
      var parts;
      components.shift();
      for (var i = 0; i < components.length; i++) {
        parts = components[i].split(/\n|\r/);
        parts[0] = ">" + parts[0] + "\n";
        components[i] = parts.join('');
        components[i] = components[i].toUpperCase();
        components[i] = components[i] + "\n";
      }
      contents = components.join('');
      
      // Check validity of FASTA data, and send it to GeneSlider
      if (checkFastaSeq(contents)) {
        pjs.resetData()
        pjs.setFastaData(contents); // Set fasta data
      }
    }
    inputFile.readAsText(file);
  }
}

// Load an AGI into GeneSlider
function agiLoader(agi, before, after, zoomFrom, zoomTo, Bitscore, alnIndicator) {

  function bind() {
    pjs = Processing.getInstanceById('GeneSlider');
  
    if (pjs != null) {
      pjs.bindJavascript(this);
      bound = true;

      // Runs the webservice that fetches data using AGI
      var url = "http://bar.utoronto.ca/~asher/GeneSlider_New/cgi-bin/alignmentByAgi.cgi?agi=" + agi + "&before=" + before + "&after=" + after;
      $.getJSON(url, function(data) {
        jsonClone = JSON.parse(JSON.stringify(data));
        if (data.fileData != "") {
          pjs.resetData();
          pjs.setAlnStart(data.start);
          pjs.setSessionData("CNCData", agi, before, after, Bitscore, alnIndicator);

          // Set the start digit
          if (zoomFrom < 0) {
            pjs.setStartDigit(before);
          } else {
            pjs.setStartDigit(zoomFrom);
          }

          // Set the end digit
          if (zoomTo < 0) {
            pjs.setEndDigit(before + 20);
          } else {
            pjs.setEndDigit(zoomTo);
          }

          
          pjs.setgffPanelOpen(true);
          pjs.setFastaData(data.fileData);
          
          // Set the search query
          if (search.length > 0 && search.length < 7) {
            for (var i = 0; i < search.length; i++) {
              for (var j = 0; j < search[i].length; j++) {
                // Set in Processing goes here
                for (key in search[i][j]) {
                  pjs.setSearch(parseInt(i,10), parseInt(j, 10), key, parseFloat(search[i][j][key]));
                }
              }
            }
          }
          setTimeout(pjs.updateURLSearchResults, 100);

        }
      });
    }
    if (!bound) {
      setTimeout(bind, 250);
    } 
  }
  bind();
}

// Load a single CNC Alignment
// This feature is currently not developed, as is no longer is use
function alignmentLoader(chr, start, end) {
  // Variables for annotations
  var fileName = "";
  var annotType = "";
  var up = 0;
  var down = 0;

  // Bind JavaScript
  if (!bound) {
    bindjs();
  }
    
  if (pjs != null) {
    // Runs the webservice that fetches data from BAR 
    var url = "http://bar.utoronto.ca/~asher/GeneSlider_New/cgi-bin/alignment.cgi?request={%22chr%22:" + chr + ",%22start%22:" + start + ",%22end%22:" + end + "}"; 
    $.getJSON(url, function(data) {       
      jsonClone = JSON.parse(JSON.stringify(data));
      fileName = data.fileName;
      if (fileName != "") {
        pjs.resetData();
        pjs.setAlnStart(data.start);
        pjs.setgffPanelOpen(true);
        pjs.setFastaData(data.fileData);
        // DO NOT DELETE: This was when the file was loaded from the file name.
        //pjs.loadFile(fileName);
        //pjs.alignmentLoader(start, end);
      }
    });
  } 
}



// Grab parameters from URL if there are any
// From eFP 2.0 and http://stackoverflow.com/questions/2627163/query-string-in-javascript?rq=1
function querystring(key) {
  var re = new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
  var r = [], m;
  while ((m = re.exec(document.location.search)) != null) r[r.length] = m[1];
  return r;
}


////////////////////////////////////////////////////////////////////////////////
// The main program flow 
//////////////////////////////////////////////////////////////////////////////// 
// Main

bindjs();

var appContext = $('[data-app-name="bar-gene-slider"]');

// Change labels when the range sliders change.
 $('input[name=before]', appContext).on("input", function(){
  $('.beforelabel').text("Before (" + this.value + ")");
 });

 $('input[name=after]', appContext).on("input", function(){
  $('.afterlabel').text("After (" + this.value + ")");
 });

  $('#fileinput', appContext).on("click", function(e){
  readFile(e);
 });


var that = this;

var form = $('form[name=workshop-tutorial-query]', appContext);
form.on('submit', function(e) {
  e.preventDefault();

  var query = {
      locus: this.locus.value,
      before: this.before.value * -1,
      after: this.after.value
    };

    console.log("query", query);
    console.log("this", this);

    that.agiLoader(query.locus, parseInt(query.before, 10), parseInt(query.after, 10), parseInt(-1, 10), parseInt(-1, 10), true, true);

});

$(window).bind("load",function() {

  // This is for retreving a CNC 
  var dataSource = querystring('datasource').toString();
  var chr = querystring('chr').toString();  // The chromosome on AT sequence
  var start = querystring('start').toString();  // The begin site on the + strand of AT sequences
  var end = querystring('end').toString();  // The end site on the + strand of the AT seqeunces
  var agi = querystring('agi').toString();  // The AT agi
  var before = querystring('before').toString();  // The length of sequence to go before the AGI
  var after = querystring('after').toString();  // The length of sequence to go after the AGI
  var zoomFrom = querystring('zoom_from').toString(); // The start digit
  var zoomTo = querystring('zoom_to').toString(); // The end digit
  var searchString = querystring('search').toString();  // The search JSON. This should be the last thing to load
  var weightedBitscore = querystring('weightedBitscore').toString(); // Set the bitscore mode
  var alnIndicator = querystring('alnIndicator').toString();  // Alignment indicator

  // Load an AGI from CNC data
  if ((agi !== "") && (dataSource === "CNCData")) {
    // Define before and after if they are not defined
    if (before === "") {
      before = 0;
    }
    if (after === "") {
      after = 0;
    }

    // Define zoom from and zoom to if they are not defined
    if (zoomFrom === "") {
      zoomFrom = -1;
    }
    if (zoomTo === "") {
      zoomTo = -1;
    }
    
    // The search string decoded from URI
    if (searchString !== "") {
      search = JSON.parse(decodeURIComponent(searchString));
    }

    // Weighted bitsore mode
    if (weightedBitscore === "") {
      weightedBitscore = "true";
    }

    // Aligmnent Indicator
    if (alnIndicator === "") {
      alnIndicator = "true";
    }

    // Load AGI's in GeneSlider
    agiLoader(agi, parseInt(before, 10), parseInt(after, 10), parseInt(zoomFrom, 10), parseInt(zoomTo, 10), weightedBitscore, alnIndicator);
    return;
  }

  // Load a sequence given a start and end sit
  if ((agi == "") && (dataSource == "CNCData") && (start != "") && (end != "") && (chr != "")) {
    alignmentLoader(parseInt(chr, 10), parseInt(start, 10), parseInt(end, 10));
  }
});




})(window, jQuery);
