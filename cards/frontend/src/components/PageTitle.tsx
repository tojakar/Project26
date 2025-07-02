import logo from '../assets/logo.png'; // adjust the path as needed


function PageTitle()
{
return(

<div style={{ position: 'relative', display: 'inline-block', textAlign: 'center'}}>
  <h1 
    id="title"
    style={{

      marginBottom: '10px',
      pointerEvents: 'none',
    }}
  >
   Water Watch 
  </h1>
  <img src={logo} alt="Logo" style={{ 
    width: '300px', 
    height: 'auto', 
    }} />
  
</div>


);
};
export default PageTitle;