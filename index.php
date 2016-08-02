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

    <script>
      $(document).ready(function(){
          $('[data-toggle="tooltip"]').tooltip();
      });
    </script>

    <div class="container-fluid">

      <div class="row">
        <div class="col-xs-12 form-inline">

          <select id="port-combo" class="form-control">
          </select>

          <button type="button" id="refresh-btn" class="btn btn-default ">
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

          <button type="button" id="settings-btn" class="btn btn-default">
            <span class="glyphicon glyphicon-cog"></span>
          </button>

        </div>
      </div>

      <div class="row">

      </div>

    </div>

  </body>
</html>
