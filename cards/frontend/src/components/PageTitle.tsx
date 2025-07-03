import logo from '../assets/logo.png';


function PageTitle()
{
return(

<div style={{ position: 'fixed', textAlign: 'left', verticalAlign: 'top'}}>
  <img src={logo} alt="Logo" style={{ 
    width: '70px', 
    height: 'auto', 
    top: 17,
    left: 25,
    position: 'fixed'

    }} />
    <h1 id="title" style = {{
      position: 'fixed', top: 17, left: 110
    }}> Water Watch </h1>
  
</div>


);
};
export default PageTitle;