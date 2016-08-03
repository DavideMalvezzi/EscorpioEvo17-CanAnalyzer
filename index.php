<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title></title>

    <!-- Bootstrap -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css">

    <link rel="stylesheet" href="css/style.css">

    <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.2/html5shiv.js"></script>
      <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
    <![endif]-->
  </head>

  <body>
    <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
    <!-- Include all compiled plugins (below), or include individual files as needed -->
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>

    <!-- Include custom bootstrap functions utils-->
    <script src="js/bootstrap_utils.js"></script>
    <!-- Include serial port functions -->
    <script src="js/serial_port.js"></script>
    <!-- Include ui functions -->
    <script src="js/ui_interface.js"></script>

    <script>
      $(
        function(){
          isExtensionInstalled(
            function(installed){
              if(!installed){
                showAlert('#error-alert', 'Serial Port Interface extension is missing. <a href="#">Please install it here.</a>');
              }
              else{
                reloadPort();
              }
            }
          );
        }
      );
    </script>

    <div class="container-fluid">

      <div id="menu-header" class="row form-inline">
        <div class="col-xs-4 col-md-3 col">
          Serial Port
        </div>

        <div class="col-xs-3 col-md-1 col">
          Modes
        </div>

        <div class="col-xs-3 col-md-2 col">
          Actions
        </div>

        <div class="col-xs-2 col-md-1 col">
          Settings
        </div>
      </div>

      <div id="menu-items" class="row form-inline">
        <div class="col-xs-4 col-md-3 col">
          <select id="port-combo" class="form-control">
          </select>

          <button type="button" id="refresh-btn" class="btn btn-default" onclick="reloadPort()">
            <span class="glyphicon glyphicon-refresh"></span>
          </button>

          <div class="btn-group">
            <button type="button" id="open-btn" class="btn btn-default disabled">
              <span class="glyphicon glyphicon-play"></span>
            </button>

            <button type="button" id="pause-btn" class="btn btn-default hide">
              <span class="glyphicon glyphicon-pause"></span>
            </button>

            <button type="button" id="stop-btn" class="btn btn-default disabled">
              <span class="glyphicon glyphicon-stop"></span>
            </button>
          </div>
        </div>

        <div class="col-xs-3 col-md-1 col">
          <div class="btn-group" role="group" aria-label="Mode">
            <button type="button" id="rx-btn" class="btn btn-default">
              <span class="glyphicon glyphicon-download"></span>
            </button>

            <button type="button" id="tx-btn" class="btn btn-default">
              <span class="glyphicon glyphicon-upload"></span>
            </button>
          </div>
        </div>

        <div class="col-xs-3 col-md-2 col">
          <div class="btn-group">
            <button type="button" id="remove-btn" class="btn btn-default">
              <span class="glyphicon glyphicon-arrow-down"></span>
            </button>

            <button type="button" id="filter-btn" class="btn btn-default">
              <span class="glyphicon glyphicon-filter"></span>
            </button>

            <button type="button" id="remove-btn" class="btn btn-default">
              <span class="glyphicon glyphicon-remove"></span>
            </button>
          </div>
        </div>

        <div class="col-xs-2 col-md-1 col">
          <button type="button" id="settings-btn" class="btn btn-default" onclick="$('#settings-modal').modal()">
            <span class="glyphicon glyphicon-cog"></span>
          </button>
        </div>
      </div>

      <div id="success-alert" class="alert alert-success hidden fade in">
        <span id="success-alert-text"></span>
        <a href="#" class="close" aria-label="close" onClick="hideAlert('#succes-alert')">&times;</a>
      </div>

      <div id="error-alert" class="alert alert-danger hidden fade in">
        <span id="error-alert-text"></span>
        <a href="#" class="close" aria-label="close" onClick="hideAlert('#error-alert')">&times;</a>
      </div>

      <div class="row table-responsive">
        <table class="table">

        </table>
      </div>

      <div class="modal fade" id="settings-modal" tabindex="-1" role="dialog" aria-labelledby="" aria-hidden="true">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
              <h4 class="modal-title">Serial Port Settings</h4>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="serial-port-bitrate">BitRate:</label>
                <select id="serial-port-bitrate" class="form-control">
                  <option value="4800">4800</option>
                  <option value="9600">9600</option>
                  <option value="19200">19200</option>
                  <option value="9600">115200</option>
                </select>
              </div>

              <div class="form-group">
                <label for="serial-port-databit">DataBits:</label>
                <select id="serial-port-databit" class="form-control">
                  <option value="seven">7</option>
                  <option value="eight">8</option>
                </select>
              </div>

              <div class="form-group">
                <label for="serial-port-stopbit">StopBit:</label>
                <select id="serial-port-stopbit" class="form-control">
                  <option value="one">1</option>
                  <option value="two">2</option>
                </select>
              </div>

              <div class="form-group">
                <label for="serial-port-paritybit">ParityBit:</label>
                <select id="serial-port-paritybit" class="form-control">
                  <option value="no">No</option>
                  <option value="odd">Odd</option>
                  <option value="even">Even</option>
                </select>
              </div>


            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-default" data-dismiss="modal">Save</button>
              <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>

    </div>

  </body>
</html>
