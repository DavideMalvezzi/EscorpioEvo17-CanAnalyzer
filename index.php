<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link href="img/favicon.ico" rel="icon">

    <title>Can Analyzer</title>

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
    <?php
      require('db_access.php');
      connectToDb();

      $sql = "SELECT can_id, name, size, type, formula FROM channel ORDER BY can_id ASC";
      $result = $conn->query($sql);
    ?>

    <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
    <!-- Include all compiled plugins (below), or include individual files as needed -->
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>

    <!-- W3C cookies functions -->
    <script src="js/cookies.js"></script>
    <!-- Include custom circular buffer functions utils -->
    <script src="js/circular_buffer.js"></script>
    <!-- Include custom binary conversion functions utils -->
    <script src="js/conversion.js"></script>
    <!-- Include custom bootstrap functions utils -->
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
                showAlert('#error-alert', 'Serial Port Interface extension is missing. <a href="extension/ChromeSerialPortExtension.crx">Please install it here.</a>');
              }
              else{
                reloadPort();
              }
            }
          );

          window.onbeforeunload = function(){
            if(serialPort.isOpen()){
              serialPort.closePort(
                function(response){
                  if(response.result === "ok"){
                    return null;
                  }
                  else{
                    alert(response.error);
                    return false;
                  }
                }
              );
            }
            return null;
          }

          <?php
            while($row = $result->fetch_assoc()){
              echo 'channels[' . $row['can_id'] . '] = {name: "' . $row['name'] . '", size: ' . $row['size'] . ', type: "' . $row['type'] . '", formula: function(x){return ' . $row['formula'] . ';}};' . PHP_EOL;
            }
          ?>
        }
      );
    </script>

    <nav class="navbar navbar-default navbar-fixed-top" role="navigation" style="background-color: transparent; border:none; top:0px;">
      <div class="container-fluid">
        <div id="menu-header" class="row form-inline">
          <div class="col-xs-4 col-md-4 col">
            Serial Port
          </div>

          <div class="col-xs-3 col-md-2 col">
            Actions
          </div>

          <div class="col-xs-3 col-md-2 col">
            Modes
          </div>

          <div class="col-xs-2 col-md-1 col">
            Settings
          </div>
        </div>
        <div id="menu-items" class="row form-inline">
          <div class="col-xs-4 col-md-4 col">
            <select id="port-combo" class="form-control" style="min-width: 150px;">
            </select>

            <button type="button" id="refresh-btn" class="btn btn-primary" onclick="reloadPort()">
              <span class="glyphicon glyphicon-refresh"></span>
            </button>

            <div class="btn-group">
              <button type="button" id="open-btn" class="btn btn-primary disabled" onclick="openPort()" disabled>
                <span class="glyphicon glyphicon-play"></span>
              </button>

              <button type="button" id="pause-btn" class="btn btn-primary" onclick="pause()" disabled>
                <span class="glyphicon glyphicon-pause"></span>
              </button>

              <button type="button" id="close-btn" class="btn btn-primary disabled" onclick="closePort()" disabled>
                <span class="glyphicon glyphicon-stop"></span>
              </button>
            </div>
          </div>

          <div class="col-xs-3 col-md-2 col">
            <div class="btn-group">
              <button type="button" id="down-btn" class="btn btn-primary" onclick="toggleAlwaysDown()">
                <span class="glyphicon glyphicon-arrow-down"></span>
              </button>

              <button type="button" id="filter-btn" class="btn btn-primary" onclick="showFilterModal()">
                <span class="glyphicon glyphicon-filter"></span>
              </button>

              <button type="button" id="remove-btn" class="btn btn-primary" onclick="clearTables()">
                <span class="glyphicon glyphicon-remove"></span>
              </button>
            </div>
          </div>

          <div class="col-xs-3 col-md-2 col">
            <div class="btn-group" role="group" aria-label="Mode">
              <button type="button" id="rx-chrono-btn" class="btn btn-primary active" onclick="setRxChronoMode()">
                <span class="glyphicon glyphicon-time"></span>
              </button>

              <button type="button" id="rx-unique-btn" class="btn btn-primary" onclick="setRxUniqueMode()">
                <span class="glyphicon glyphicon-list-alt"></span>
              </button>

              <button type="button" id="tx-btn" class="btn btn-primary" onclick="setTxMode()">
                <span class="glyphicon glyphicon-send"></span>
              </button>
            </div>
          </div>

          <div class="col-xs-2 col-md-1 col">
            <button type="button" id="settings-btn" class="btn btn-primary" onclick="showSettingsModal()">
              <span class="glyphicon glyphicon-cog"></span>
            </button>
          </div>
        </div>

        <div id="success-alert" class="alert alert-success hide fade in">
          <span id="success-alert-text"></span>
          <a href="#" class="close" aria-label="close" onClick="hideAlert('#succes-alert')">&times;</a>
        </div>

        <div id="error-alert" class="alert alert-danger hide fade in">
          <span id="error-alert-text"></span>
          <a href="#" class="close" aria-label="close" onClick="hideAlert('#error-alert')">&times;</a>
        </div>
      </div>
    </nav>

    <div class="container-fluid" style="padding-top: 120px;">

      <div id="table-container" class="row">
        <div class="col-xs-12">

          <div id="rx-table-container" class="table-responsive hide">
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>CAN ID</th>
                  <th>Name</th>
                  <th>Size</th>
                  <?php
                    for($i = 0; $i < 8; $i++){
                      echo '<th style="max-width: 50px; min-width: 50px;">D' . $i . '</th>';
                    }
                  ?>
                  <th>Value</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody id="rx-table-body">

              </tbody>
            </table>
          </div>

          <div id="tx-table-container" class="row">
            <div class="col-xs-8 table-responsive">
              <table class="table table-bordered">
                <thead>
                  <tr>
                    <th>CAN ID</th>
                    <th>Name</th>
                    <th>Size</th>
                    <?php
                      for($i = 0; $i < 8; $i++){
                        echo '<th style="max-width: 50px; min-width: 50px;">D' . $i . '</th>';
                      }
                    ?>
                  </tr>
                </thead>

                <tbody id="tx-table-body">

                </tbody>
              </table>
            </div>

            <div class="col-xs-4" id="tx-send-panel">
              <div class="row">
                <h2 style="color: white">Send hex data</h2>
              </div>
              <?php
                for($i = 0; $i < 10; $i++){
                  echo '<div class="row">';
                    echo'<div class="col-xs-4 padding-2">';
                      echo '<select id="tx-combo-' . $i . '" class="form-control" id="tx-channel-combo-' . $i . '">';
                              $result->data_seek(0);
                              while($row = $result->fetch_assoc()){
                                echo'<option value="' . $row["can_id"] . '">' . $row["can_id"] . " " . $row["name"] . "</option>";
                              }

                      echo '</select>';
                    echo '</div>';

                    echo '<div class="col-xs-6 padding-2">';
                      echo '<input type="text" class="form-control" id="tx-text-' . $i . '" onkeypress="return checkSendData(' . $i . ')">';
                    echo '</div>';

                    echo '<div class="col-xs-2 padding-2">';
                      echo '<button type="button" class="btn btn-success" onclick="sendTxData(' . $i . ')">';
                        echo '<span class="glyphicon glyphicon-send"></span>';
                      echo '</button>';
                    echo '</div>';
                  echo '</div>';
                }
              ?>
            </div>
          </div>

        </div>
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
                  <option value="115200">115200</option>
                </select>
              </div>

              <div class="form-group">
                <label for="serial-port-databits">DataBits:</label>
                <select id="serial-port-databits" class="form-control">
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
              <button type="button" class="btn btn-default" data-dismiss="modal" onclick="saveSettings()">Save</button>
              <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal fade" id="filter-modal" tabindex="-1" role="dialog" aria-labelledby="" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="modal-title">Apply filter</h4>
            </div>

            <div class="modal-body">
              <div class="row">
                <div class="col-xs-12">
                  <label for="filter-none" class="radio-inline">
                    <input type="radio" id="filter-none" name="filter-type" onclick="onFilterSelected('none')">None
                  </label>

                  <label for="filter-range" class="radio-inline">
                    <input type="radio" id="filter-range" name="filter-type" onclick="onFilterSelected('range')">Range
                  </label>

                  <label for="filter-list" class="radio-inline">
                    <input type="radio" id="filter-list" name="filter-type" onclick="onFilterSelected('list')">List
                  </label>
                </div>
              </div>
            </div>

            <div class="row" style="padding: 8px 16px 8px 16px;">
              <div class="col-xs-6">
                <label for="min-channel-list">Min:</label>
                <select id="min-channel-list" class="form-control" style="min-width: 150px">
                  <?php
                    $result->data_seek(0);
                    while($row = $result->fetch_assoc()){
                      echo'<option value="' . $row["can_id"] . '">' . $row["can_id"] . " " . $row["name"] . "</option>";
                    }
                  ?>
                </select>

                <label for="max-channel-list">Max:</label>
                <select id="max-channel-list" class="form-control" style="min-width: 150px">
                  <?php
                    $result->data_seek(0);
                    while($row = $result->fetch_assoc()){
                      echo'<option value="' . $row["can_id"] . '">' . $row["can_id"] . " " . $row["name"] . "</option>";
                    }
                  ?>
                </select>
              </div>

              <div class="col-xs-6">
                <form class="form-inline" role="form">
                  <select id="channel-list" class="form-control" style="min-width: 150px; max-width: 200px;">
                    <?php
                      $result->data_seek(0);
                      while($row = $result->fetch_assoc()){
                        echo'<option value="' . $row["can_id"] . '">' . $row["can_id"] . " " . $row["name"] . "</option>";
                      }
                    ?>
                  </select>

                  <div class="btn-group btn-group-sm pull-right">
                    <button type="button" id="add-channel" class="btn btn-default" onclick="addToSelectedChannels()">
                      <span class="glyphicon glyphicon-plus"></span>
                    </button>

                    <button type="button" id="remove-channel" class="btn btn-default" onclick="removeFromSelectedChannels()">
                      <span class="glyphicon glyphicon-minus"></span>
                    </button>
                  </div>
                </form>

                <select multiple class="form-control" id="selected-channel-list">
               </select>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-default" data-dismiss="modal" onclick="applyFilter()">Apply</button>
            </div>
          </div>
        </div>
      </div>

    </div>

    <?php
      disconnectFromDb();
    ?>
  </body>
</html>
