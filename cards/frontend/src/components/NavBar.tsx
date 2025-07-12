import { useNavigate } from 'react-router-dom';



function NavBar() {

  const navigate = useNavigate();

  const doMap = () => {
    navigate('/map');
  };
  
  
  return (
    <div style={{ 
        position: 'fixed', 
        top: 65, 
        left: 570,
        }}>
        <span id="Nav">Home </span>
        <span id="Nav" onClick={doMap} style={{ cursor: 'pointer' }}>Map </span>
        <span id="Nav"> About </span><br />

    </div>
  );
}

export default NavBar;