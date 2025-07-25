import logo from '../assets/logo.png';

function PageTitle() {
  return(
    <div style={{ 
      position: 'absolute', 
      top: 30,
      left: 140,
      display: 'flex',
      alignItems: 'center',
      gap: '15px'  // Space between logo and title
    }}>
      <img src={logo} alt="Logo" style={{ 
        width: '70px', 
        height: 'auto'
      }} />
      <h1 style={{
        marginTop: 50,
      }}> Water Watch </h1>
    </div>
  );
}

export default PageTitle;