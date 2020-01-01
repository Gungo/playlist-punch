import React, { Component } from 'react'
import Spotify from 'spotify-web-api-js'
import queryString from 'query-string'
import 'reset-css/reset.css'
import './App.css'

const spotify_api = new Spotify();

let default_style = {
  color: '#9',
  'font-family': 'Helvetica Neue'
}

class PlaylistCounter extends Component {
  render () {
    return (
      <div style={default_style}>
        <h2>{this.props.playlists.length} playlists</h2>
      </div>
    );
  }
}

class HoursCounter extends Component {
  render () {
    // reduces something to a single value -- reduce playlist to list of songs
    let all_tracks = this.props.playlists.reduce((tracks, each_playlist) => {
      return tracks.concat(each_playlist.tracks)
    }, [])
    let total_duration_ms = all_tracks.reduce((sum, each_track) => {
      return sum + each_track.duration_ms
    }, 0)
    let total_hours = Math.round((total_duration_ms/1000/3600)*100)/100

    return (
      <div style={{...default_style, display: 'inline-block'}}>
        <h3>{total_hours} hours</h3>
      </div>
    )
  }
}

class Filter extends Component {
  render () {
    return (
      <div className="main" style={default_style}>
        <div className="form-group has-search">
          <span className="fa fa-search form-control-feedback"></span>
          <input type="text" className="form-control" placeholder="Search" onKeyUp={event => this.props.onTextChange(event.target.value) }>
          </input>
        </div>
      </div>
    )
  }
}

class Playlist extends Component {
  render() {
    let playlist = this.props.playlist
    return (
      <div style={{...default_style,
         'width': "25%",
         'display': 'inline-block',
         'text-align': 'center',
         'padding': '15px',
         'line-height': '30px'
       }}>
        <img src={playlist.image} style={{width: '90%'}}/>
        <h4>{playlist.name}</h4>
        <ul>
          {playlist.tracks.slice(0,3).map(track =>
            <li style={{...default_style,
              'font-size': '75%',
              'text-align': 'left',
              'margin-left': '5%'
            }}>{track.name}</li>
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
      spotify_api.setAccessToken(token)
    }
    this.state = {
      filter_string: '',
    }
  }

  getUser() {
    spotify_api.getMe()
      .then(data => this.setState({
          user: {name: data.display_name}
      }))
  }

  setData(){
    spotify_api.getUserPlaylists()
      .then(playlists_data => {
        let playlists = playlists_data.items
        let track_promises = playlists.map(playlist => {
            return spotify_api.getPlaylistTracks(playlist.id)
          })
        let all_track_promises =
          Promise.all(track_promises)
        let playlists_promise = all_track_promises.then(track_datas => {
          track_datas.forEach((track_data, i) => {
            let track_data_array = Array.from(track_data.items
              .map(item => item.track))
              .map(track_data => ({
                name: track_data.name,
                artist: track_data.artists[0].name,
                duration_ms: track_data.duration_ms,
                id: track_data.id
              }))
            playlists[i].track_datas = track_data_array
          })
          return playlists
        })
        return playlists_promise
    })
    .then(playlists => this.setState({
      playlists: playlists.map(item => {
        console.log(item)
        return {
          name: item.name,
          image: item.images[0].url,
          tracks: item.track_datas
        }
      })
    }))
  }

  componentDidMount() {
    this.getUser()
    this.setData()
  }

  render() {
    let playlists_to_render =
      this.state.user &&
      this.state.playlists
        ? this.state.playlists.filter(playlist =>
          playlist.name.toLowerCase().includes(
            this.state.filter_string.toLowerCase()))
        : []
    return (
      <div className="App">
        {this.state.user
          ? <div>
              <h1 style={{...default_style,
                'font-size': '48px',
              }}>
                {this.state.user.name}'s Playlists
              </h1>
                <PlaylistCounter playlists={playlists_to_render}/>
                <HoursCounter playlists={playlists_to_render}/>
                <Filter onTextChange={text => {
                    this.setState({filter_string: text})
                  }}/>
                {playlists_to_render.map(playlist =>
                  <Playlist playlist={playlist} />
                )}
            </div>
          : <button onClick={() => {
              window.location = window.location.href.includes('localhost')
                ? 'http://localhost:8888/login'
                : 'https://playlist-punch-backend.herokuapp.com/login' } // ADD LATER
            } style={{padding: '20px', 'font-size': '50px', 'marginTop': '20px'}}>Sign in with Spotify</button>
        }
      </div>
    )
  }
}

export default App
