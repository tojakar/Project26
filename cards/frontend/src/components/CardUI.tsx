import React, { useState } from 'react';
import { buildPath } from './Path';
import { retrieveToken, storeToken } from '../tokenStorage';
import axios from 'axios';

function CardUI() {
  const [message, setMessage] = useState('');
  const [searchResults, setResults] = useState('');
  const [cardList, setCardList] = useState('');
  const [search, setSearchValue] = React.useState('');
  const [card, setCardNameValue] = React.useState('');

  const _ud = localStorage.getItem('user_data');
  const ud = JSON.parse(String(_ud));
  const userId = ud.id;

  async function addCard(e: any): Promise<void> {
    e.preventDefault();
    const obj = { userId: userId, card: card, jwtToken: retrieveToken() };

    try {
      const response = await axios.post(buildPath('api/addcard'), obj, {
        headers: { 'Content-Type': 'application/json' }
      });

      const res = response.data;

      if (res.error && res.error.length > 0) {
        setMessage('API Error: ' + res.error);
      } else {
        setMessage('Card has been added');
        storeToken(res.jwtToken);
      }
    } catch (error: any) {
      setMessage(error.toString());
    }
  }

  async function searchCard(e: any): Promise<void> {
    e.preventDefault();
    const obj = { userId: userId, search: search, jwtToken: retrieveToken() };

    try {
      const response = await axios.post(buildPath('api/searchcards'), obj, {
        headers: { 'Content-Type': 'application/json' }
      });

      const res = response.data;
      const _results = res.results;

      let resultText = _results.join(', ');

      setResults('Card(s) have been retrieved');
      storeToken(res.jwtToken);
      setCardList(resultText);
    } catch (error: any) {
      alert(error.toString());
      setResults(error.toString());
    }
  }

  function handleSearchTextChange(e: any): void {
    setSearchValue(e.target.value);
  }

  function handleCardTextChange(e: any): void {
    setCardNameValue(e.target.value);
  }

  return (
       
    <div className="background-container">
    <div id="ButtonDiv" className="form">
      <br />
      Search: <input type="text" id="searchText" placeholder="Card To Search For" onChange={handleSearchTextChange} />
      <button type="button" id="searchCardButton" className="buttons" onClick={searchCard}>Search Card</button><br />
      <span id="cardSearchResult">{searchResults}</span>
      <p id="cardList">{cardList}</p><br /><br />

      Add: <input type="text" id="cardText" placeholder="Card To Add" onChange={handleCardTextChange} />
      <button type="button" id="addCardButton" className="buttons" onClick={addCard}>Add Card</button><br />
      <span id="cardAddResult">{message}</span>
    </div>
    </div>
  );
}

export default CardUI;