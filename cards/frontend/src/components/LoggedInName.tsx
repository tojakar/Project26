function LoggedInName()
{
function doLogout(event:any) : void
{
event.preventDefault();
localStorage.removeItem("user_data")
window.location.href = '/';
};
return(
<div id="loggedInDiv">
<button type="button" id="logoutButton" className="buttons"
onClick={doLogout} style={{float: 'right'}}> Log Out </button>
</div>
);
};
export default LoggedInName;