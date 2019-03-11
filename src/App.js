import React, { Component } from 'react';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import ReactTooltip from 'react-tooltip';
import plains from './images/plains.svg';
import forest from './images/forest.svg';
import mountain from './images/mountain.svg';
import './App.css';
import _ from 'underscore';

const images = [forest,plains,mountain];
const Colors = {
  R: '#E07A5F', 
  U: '#6080C9', 
  G: '#81B29A', 
  W: '#F4F1DE', 
  B: '#2D2D2A', 
  C: '#b7aa79', 
  GW: 'linear-gradient(125deg, rgb(244, 241, 222) 0%, rgb(244, 241, 222) 50%, rgb(129, 179, 154) 50%, rgb(129, 179, 154) 100%)',
  RW: 'linear-gradient(125deg, rgb(244, 241, 222) 0%, rgb(244, 241, 222) 50%, rgb(224, 122, 95) 50%, rgb(224, 122, 95) 100%)'
}

const apiPath = process.env.REACT_APP_API_PATH || 'http://localhost:3001/api';


class App extends Component {
  state = {
    cards: [],
    lastCount: window.localStorage.getItem('lastCount') || 0,
    searchTerm: '',
    decklist: '',
    headerImage: images[Math.floor(Math.random()*images.length)],
    message: ''
  }
  
  handleChange = e => {
    const target = e.target;
      const value = target.type === 'checkbox' ? target.checked : target.value;
      const name = target.name;
      this.setState({
        [name]: value
      });
  }
  
  doSearch = () => {
    const { searchTerm } = this.state;
    fetch(`${apiPath}/cards/${searchTerm}`)
  }
  
  analyzeDeck = () => {
    const { decklist } = this.state;
    if (!decklist) this.setState({
      message: <div>Looks like an empty deck. You will want cards in your deck. <a href="/guidelines">Formatting Guidelines</a></div>
    })
    else if(isNaN(decklist[0])) {
      this.setState({
        message: <div>Hmm, that format looks off. Try again? <a href="/guidelines">Formatting Guidelines</a></div>
      })
      return;
    }
    let processedDl = decklist.trim().split('\n');
    processedDl = processedDl.map(l => {
      const temp = l.split(' ');
      if (temp[0]) {
        const r = {};
        r.count = +temp[0].match(/\d+/)[0];
        if (temp.length === 2) r.card = temp[1];
        else {
          let name = temp[1];
          for (let i = 2; i < temp.length; i++) {
            if (temp[i]) name += `_${temp[i]}`;
          }
          r.card = name;
        }
        return r;
      }
    })
    this.deckAnalysis(processedDl);
  }
  
  deckAnalysis = (list) => {
    fetch(`${apiPath}/deck-analysis`, {
      method: 'POST',
      mode: 'cors',
      headers: {
            "Content-Type": "application/json",
        },
      body: JSON.stringify(list)
    })
      .then(res => res.json())
      .then(deckData => {
        console.log(deckData)
        this.setState({
          deckData
        })
      })
      .catch(err => console.log(err))
  }
  
  componentDidMount() {
    // if (!window.localStorage.getItem('cards')) {
    //   fetch(`${apiPath}/cards`)
    //   .then(res => res.json())
    //   .then(cards => {
    //     this.setState({cards});
    //     window.localStorage.setItem('lastCount', cards.length)
    //     window.localStorage.setItem('cards', JSON.stringify(cards))
    //   })
    //   .catch(err => console.log(err))
    // } else {
    //   this.setState({
    //     cards: JSON.parse(window.localStorage.getItem('cards'))
    //   })
    // }
  }
  
  render() {
    console.log(this.state)
    const { searchTerm, decklist, deckData, headerImage, message } = this.state;
    const devotionBreakdown = deckData && deckData.manaCosts.map(c => c.count > 0 && <div className='color-cost-circle' style={{background: Colors[c.color]}}>{c.count}</div>)
    const sourceRecBreakdown = deckData && _.map(deckData.manaSourceRec, (num, color) => num > 0 ? <div className='color-cost-circle' style={{background: Colors[color]}}>{num}</div> : null)
    return (
      <div className="App">
        <header className="App-header">
          <img src={headerImage} className="mana-large" alt="mountain" />
          <h1>EXARCH</h1>
          <p>
            A deckbuilding toolkit for Magic: the Gathering players, fans and friends.
          </p>
        </header>
        <main>
          {/*<input type='text' placeholder='Search for a card' onChange={this.handleChange}></input>
        <button name='searchTerm' value={searchTerm} onClick={this.doSearch}>Search</button>*/}
          <div className='analysis-section'>
            <p>
              Paste your decklist here:
            </p>
            <div style={{fontSize: '16px', color: 'rgb(181, 52, 52)'}}>{message && message}</div>
            <div className='decklist-section'>
              <textarea className='decklist' name='decklist' value={decklist} onChange={this.handleChange} rows={10}></textarea>
              <div className='results'>
                {deckData && 
                  <>
                  <h3>CMC Breakdown</h3>
                  <BarChart width={400} height={400} data={deckData.cmcDistribution}>
                    <CartesianGrid strokeDasharray="5 5" />
                    <XAxis dataKey="cmc" />
                    <YAxis />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="U" barSize={20} fill={Colors.U} />
                    <Bar dataKey="W" barSize={20} fill={Colors.W} />
                    <Bar dataKey="R" barSize={20} fill={Colors.R} />
                    <Bar dataKey="B" barSize={20} fill={Colors.B} />
                    <Bar dataKey="G" barSize={20} fill={Colors.G} />
                    <Bar dataKey="C" barSize={20} fill={Colors.C} />
                  </BarChart>
                  <ul>
                    <li data-tip="hello world">Average CMC: {deckData.avgCMC}</li>
                    {deckData.adjustedCMC !== deckData.avgCMC && <li>Adjusted CMC: {deckData.adjustedCMC || 0}</li>}
                    {deckData.cantripCount > 0 && <li>Cantrips: {deckData.cantripCount}</li>}
                    {deckData.accelCount > 0 && <li>Accelerators: {deckData.accelCount}</li>}
                    <li>Devotion: <div style={{display: 'flex'}}>{devotionBreakdown}</div></li>
                    <li>{deckData.size} cards in deck</li>
                    {_.map(deckData.counts, (type, key) => type > 0 ? <li key={key}>{type} {key === 'sorcery' ? 'sorcerie' : key}s</li> : null)}
                    {deckData.notFound.length > 0 && <div><em>Not Found:</em> <ul>{deckData.notFound.map(c => <li>{c}</li>)}</ul></div>}
                    <h3>Recommendations:</h3>
                    <li>Land Count: {deckData.landRec}</li>
                    <li>Source Breakdown: <div style={{display: 'flex'}}>{sourceRecBreakdown}</div></li>
                </ul>
                </>
                }
              </div>
            </div>
            <button className='button' onClick={this.analyzeDeck}>Analyze</button>
          
          </div>
        </main>
        <footer>We pull card data from the lush, full-bodied <a href='https://scryfall.com/'>Scryfall API</a>.</footer>
        <ReactTooltip type='light' />
      </div>
    );
  }
}

export default App;
