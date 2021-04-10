function getFileList(bucket_name, data_sheet_name) {
  //bucket_name = 'oirmediaformat';
  //var data_sheet_name = 'Format' //TODO: change it to sheet name where data needs to be appended e.g 'Room', 'Format', 'Location'
  var file_list_sheet = 'Processed_Files';
  var file_list_url = getUrlFileList(bucket=bucket_name, path='')

  response=UrlFetchApp.fetch(file_list_url).getContentText()
  var document = XmlService.parse(response);
  var root = document.getRootElement();
  var atom = XmlService.getNamespace('http://s3.amazonaws.com/doc/2006-03-01/')
  var entries = root.getChildren('Contents', atom);
  var labels = [];

  //Logger.log(entries)
  for (var i = 0; i < entries.length; i++) {
    var title = entries[i].getChild('Key', atom).getText();
    if (title.endsWith('.csv') ) {    
      labels.push(title)
    }
  }

  var new_files = []
  var processed_files = []
  var sheet = SpreadsheetApp.getActive().getSheetByName(file_list_sheet);
  var data_sheet = SpreadsheetApp.getActive().getSheetByName(data_sheet_name);

  var range = sheet.getDataRange();
  var processed_file_list = range.getValues()
  for (var i = 0; i < processed_file_list.length; i++) { processed_files.push(processed_file_list[i][0]) }
  Logger.log("processed_files:")
  Logger.log(processed_files)

  for (var i = 0; i < labels.length; i++) {
    if(processed_files.indexOf(labels[i])==-1){ new_files.push(labels[i]) }
  }
  Logger.log("new files:")
  Logger.log(new_files)
  if (new_files.length>0){
    for (var i = 0; i < new_files.length; i++) {

      var status = getDataFromURL(bucket_name, new_files[i], data_sheet);

      //If data is processed successfully, add the file name to processed_files sheet
      if (status == 1){
        sheet.getRange(sheet.getLastRow()+1, 1).setValue([new_files[i]])
      }
    }
  }


}



function getDataFromURL(bucket_name,file_name, data_sheet) {
  Logger.log("Processing file:" + file_name)
  signedURL = getUrlFileList(bucket=bucket_name, path = file_name)
  var csvContent = UrlFetchApp.fetch(signedURL).getContentText()
  var csvData = Utilities.parseCsv(csvContent);

//Remove headers from the data and create headers array
  var header = csvData.shift(); 
  var column_names = [[]]
  for(var i=0; i<header.length; i++){
    column_names[0][i]=header[i]
  }

  //Add headers
  if(!(data_sheet.getRange(1, 1, 1, header.length).getValues().lenght>0)){
  data_sheet.getRange(1, 1, 1, header.length).setValues(column_names); 
  }

  //Append data to the sheet
  data_sheet.getRange(data_sheet.getLastRow()+1, 1, csvData.length, csvData[0].length).setValues(csvData);

  return 1
}


