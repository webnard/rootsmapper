﻿<?php

require_once('includes/config.php');
require_once('includes/fs-auth-lib.php');

session_start();

switch ($SITE_MODE):
	case 'production':
		$auth_subdomain = "ident.";
		break;
	case 'beta':
		$auth_subdomain = "identbeta.";
		break;
	case 'sandbox':
		$auth_subdomain = "sandbox.";
		break;
endswitch;

$fs = new FSAuthentication($auth_subdomain);

//Generate fingerprint for session security
$fingerprint = $SECRET_WORD . $_SERVER['HTTP_USER_AGENT'];
$ipblocks = explode('.', $_SERVER['REMOTE_ADDR']);
for ($i=0; $i<2; $i++)
{
	$fingerprint .= $ipblocks[$i] . '.';
}


// If we're returning from the oauth2 redirect, capture the code and store session
// this way we don't have to reauthenticate after every reload
if( isset($_REQUEST['code']) ) {
	  session_regenerate_id(true); //Regenerate session ID
	  $_SESSION['fs-session'] = $fs->GetAccessToken($DEV_KEY, $_REQUEST['code']); //Store access code in session variable
	  $_SESSION['fingerprint'] = md5($fingerprint);
	  header('Location: ./'); //Refresh page to clear POST variables
	  exit;
} 

// If login is clicked, begin request
else if (isset($_REQUEST['login'])) {
	unset($_SESSION['fs-session']); //clear session variable
	unset($_SESSION['fingerprint']); //clear fingerprint variable
	session_destroy();
	$url = $fs->RequestAccessCode($DEV_KEY, $OAUTH2_REDIRECT_URI);
	header("Location: " . $url); //Redirect to FamilySearch auth page
	exit;
}

// If we have both a valid auth token in our session and our fingerprint matches
// set the access token to a local variable, otherwise make sure it is unset
if (isset($_SESSION['fs-session']) && $_SESSION['fingerprint'] == md5($fingerprint))
{
	$access_token = $_SESSION['fs-session']; //store access token in variable
}
else
{
	unset($access_token);
}

?>

<!DOCTYPE html>
<html>
    <head>
        <title><?php echo isset($TITLE)? $TITLE : ""; ?></title>
        <?php echo isset($DESCRIPTION)? "<meta name=\"description\" content=\"" . $DESCRIPTION . "\" />" : ""; ?>

        <link href="css/map.css?v=<?php echo isset($VERSION)? $VERSION : ""; ?>" rel="stylesheet" />

        <!-- Google Maps API reference -->
        <script src="//maps.googleapis.com/maps/api/js?sensor=false&libraries=places,geometry"></script>
	<!-- map references -->

	<!-- loading animation references -->
	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>
	<script type="text/javascript" src="scripts/loading.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
	<!-- loading animation references -->
		<script src="scripts/binarytree.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/CollapsibleLists.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
        <script src="scripts/map.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/oms.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/infobox.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/url-template.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
        <script type="text/javascript">
             title='<?php echo isset($TITLE)? $TITLE : ""; ?>';
             accesstoken='<?php echo isset($access_token) ? $access_token : ""; ?>';
             baseurl='<?php echo("https://" . ($SITE_MODE == 'sandbox' ? "sandbox." : "") . "familysearch.org"); ?>';
             version='<?php echo isset($VERSION)? $VERSION : ""; ?>';
	</script>
	<script language="javascript" type="text/javascript">
  		$(window).load(function() {
    		$('#loading').hide();
 	 });
	</script>

    </head>
    <body>
        <?php echo isset($TRACKING_CODE) ? $TRACKING_CODE : ""; ?>
		<div id="bigDiv">
			<div id="adDiv">
<?php 
if (!empty($SIDEAD_CODE))
{ 
echo($SIDEAD_CODE);
}
?>
			</div>
			<div id="rootGrid">
				<div id="mapdisplay"></div>
				<div id="inputFrame">
<?php
// If we are authorized, load the buttons, otherwise show the login button
if (isset($access_token))
{ ?>
					<div class="hoverdiv">
						<label id="username" class="labelbox" for"logoutbutton">User Name</label>
						<button id="logoutbutton" class="button red" onclick="window.location='logout.php'">Logout</button>
					</div>
					<div class="hoverdiv">
                 <button id="populateUser" class="button blue" onclick="populateUser()">Me</button>
						<label id="prompt" class="labelbox" for="personid">Root Person ID:</label>
						<input id="personid" class="boxes" type="text" maxlength="8" placeholder="ID..." onkeypress="if (event.keyCode ==13) ancestorgens()"/>
                    <script src="scripts/keyfilter.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
						<select id="genSelect" class="boxes">
							<option value="1">1 generation</option>
							<option value="2">2 generations</option>
							<option selected="selected" value="3">3 generations</option>
							<option value="4">4 generations</option>
							<option value="5">5 generations</option>
							<option value="6">6 generations</option>
							<option value="7">7 generations</option>
							<option value="8">8 generations</option>
						</select>
						<button id="runButton" class="button green" onclick="ancestorgens()">Run</button>
					</div>
					
				<div id="optionDiv" style="visibility: hidden">
					<div id="optionButtons">
						<div class="hoverdiv">
							<button id="showTree" class="button yellow" onclick="toggleTree()">Family Tree</button>
						</div>
						<div class="hoverdiv">
							<button id="showStats" class="button yellow" onclick="toggleStats()">Country Statistics</button>
						</div>
						<div class="hoverdiv">
							<button id="showlines" class="button yellow off" onclick="toggleLines()">Lines</button>
						</div>
						<div class="hoverdiv">
							<button id="highlight" class="button yellow off" onclick="toggleHighlight()">Traceback</button>
						</div>
						<div class="hoverdiv">
							<button id="isolate" class="button yellow" onclick="toggleIsolate()">Isolate</button>
						</div>
					</div>
					<div id="detailViewer">
						<div id="countryStats"></div>
						<div id="pedigreeWrapper">
							<div id="pedigreeChart"></div>
						</div>
					</div>
				</div>
				<div class="hoverdiv">
						<button id="optionsButton" class="button yellow" onclick="showOptions()">Options</button>
					
						
<?php
}
else
{
?>
					<div class="hoverdiv">
						<button id="loginbutton" onclick="window.location='?login'">Login to FamilySearch</button>
<?php
}
?>
					</div>
                    <div id="loadingDiv" style="visibility: hidden">
                        <div id="loadingMessage"></div>
					    <div id="loading" class="square"></div>
                    </div>
				</div>
				
			    <div id="lowerbuttonframe">
<?php
if (!empty($PLEDGIE_CODE))
{
?>
            		<a href='https://pledgie.com/campaigns/<?php echo($PLEDGIE_CODE); ?>' target='_blank'><img id="pledgiebutton" src='https://pledgie.com/campaigns/ <?php echo($PLEDGIE_CODE); ?> .png?skin_name=chrome' border='0' ></a>
<?php
}
if (!empty($FAQ_URL))
{
?>
            		<button id="faqbutton" class="button red" onclick="window.open('<?php echo($FAQ_URL); ?>', '_blank')">FAQ</button>
<?php
}
if (!empty($FEEDBACK_URL))
{
?>
            		<button id="feedbackbutton" class="button blue" onclick="window.open('<?php echo($FEEDBACK_URL); ?>', '_blank')">Feedback</button>
<?php
}
if (!empty($DONATE_URL))
{
?>
            		<button id="donatebutton" class="button green" onclick="window.open('<?php echo($DONATE_URL); ?>', '_blank')">Donate</button>
<?php
} 
if (!empty($BLOG_URL))
{
?>
            		<button id="blogbutton" class="button green" onclick="window.open('<?php echo($BLOG_URL); ?>', '_blank')">Blog</button>
<?php
}
?>
				</div>
			</div>
		</div>
</body>
</html>
