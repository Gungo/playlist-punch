import React, { Component } from 'react'
import Spotify from 'spotify-web-api-js'
import queryString from 'query-string'
import './App.css'

const spotifyApi = new Spotify();

let defaultStyle = {
  color: '#9',
  padding: '14px'
}

class PlaylistCounter extends Component {
  render () {
    return (
      <div style={{...defaultStyle, display: 'inline-block'}}>
        <h2>{this.props.playlists.length} playlists</h2>
      </div>
    );
  }
}

class HoursCounter extends Component {
  render () {
    // reduces something to a single value -- reduce playlist to list of songs
    let allSongs = this.props.playlists.reduce((songs, eachPlaylist) => {
      return songs.concat(eachPlaylist.songs)
    }, [])
    let totalDuration = allSongs.reduce((sum, eachSong) => {
      return sum + eachSong.duration
    }, 0)
    let totalHours = Math.round((totalDuration/3600)*100)/100

    return (
      <div style={{...defaultStyle, display: 'inline-block'}}>
        <h2>{totalHours} hours</h2>
      </div>
    )
  }
}

class Filter extends Component {
  render () {
    return (
      <div style={defaultStyle}>
        <img/>
        <input type="text" onKeyUp={event => this.props.onTextChange(event.target.value) }/>
        Filter
      </div>
    )
  }
}

class Playlist extends Component {
  render() {
    let playlist = this.props.playlist
    return (
      <div style={{...defaultStyle, width: "25%", display: 'inline-block'}}>
        <img src={playlist.image} style={{width: '200px'}}/>
        <h3>{ playlist.name }</h3>
        <ul>
          {playlist.songs.map(song =>
            <li>{song.name}</li>
          )}
        </ul>
      </div>
    )
  }
}

class App extends Component {
  constructor() {
    super()
    const params = queryString.parse(window.location.search)
    const token = params.access_token
    if (token) {
      spotifyApi.setAccessToken(token)
    }
    this.state = {
      filterString: ''
    }
  }

  componentDidMount() {
    spotifyApi.getMe()
      .then(data => this.setState({
          user: {name: data.display_name}
      }))

    spotifyApi.getUserPlaylists()
      .then(data => this.setState({
        playlists: data.items.map(item => ({
          name: item.name,
          image: item.images[0].url,
          songs: []
        }))
      }))

  }
  render () {
    let playlistsToRender =
      this.state.user &&
      this.state.playlists
        ? this.state.playlists.filter(playlist =>
          playlist.name.toLowerCase().includes(
            this.state.filterString.toLowerCase()))
        : []
    return (
      <div className="App">
        {this.state.user ?
        <div>

          <h1 style={{...defaultStyle, 'font-size': '54px'}}>
            {this.state.user.name}'s Playlists
          </h1>
            <PlaylistCounter playlists= {playlistsToRender}/>
            // <HoursCounter playlists= {playlistsToRender}/>
            <Filter onTextChange={text => {
                this.setState({filterString: text})
              }
            }/>
            {playlistsToRender.map(playlist =>
              <Playlist playlist={playlist} />
            )}
          </div>: <button onClick={() => {
            window.location = window.location.href.includes('localhost')
              ? 'http://localhost:8888/login'
              : 'HEROKU_URL' } // ADD LATER
            }
            style={{padding: '20px', 'font-size': '50px', 'margin-top': '20px'}}>Sign in with Spotify</button>

         }
      </div>
    )
  }
}

export default App
