/** @jsx jsx */
/**
  Licensing

  Copyright 2020 Esri

  Licensed under the Apache License, Version 2.0 (the "License"); You
  may not use this file except in compliance with the License. You may
  obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
  implied. See the License for the specific language governing
  permissions and limitations under the License.

  A copy of the license is available in the repository's
  LICENSE file.
*/
import { FormattedMessage, jsx } from 'jimu-core';
import { BaseWidget, AllWidgetProps } from 'jimu-core';
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';
import defaultMessages from './translations/default';
import { IMConfig } from '../config';

import { Dropdown, DropdownButton, DropdownMenu, DropdownItem, Switch } from 'jimu-ui';

import { webMercatorToGeographic } from 'esri/geometry/support/webMercatorUtils';
import Point = require('esri/geometry/Point');
import GraphicsLayer = require('esri/layers/GraphicsLayer');
import Graphic = require('esri/Graphic');
import PictureMarkerSymbol = require('esri/symbols/PictureMarkerSymbol');
import Polygon = require('esri/geometry/Polygon');

const w3wApi = require("@what3words/api");

interface State {
    extent: __esri.Extent,
    center: __esri.Point,
    w3wAddress: any,
    query: any;
}

export default class Widget extends BaseWidget<AllWidgetProps<IMConfig>, State>{
    extentWatch: __esri.WatchHandle;
    centerWatch: __esri.WatchHandle;
    stationaryWatch: __esri.WatchHandle;
    w3wLayer: GraphicsLayer;

    jimuMapView: JimuMapView;

    state: State = {
        extent: null,
        center: null,
        w3wAddress: null,
        query: null
    }

    constructor(props: any) {
        super(props);
    }

    isConfigured = () => {
        return this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1;
    }

    componentDidMount() {
        w3wApi.setOptions({ key: this.props.config.w3wApiKey });
        this.w3wLayer = new GraphicsLayer({
            listMode: "hide"
        });
    }

    componentWillUnmount() {
        if (this.extentWatch) {
            this.extentWatch.remove();
            this.extentWatch = null;
        }
        if (this.centerWatch) {
            this.centerWatch.remove();
            this.centerWatch = null;
        }
        if (this.stationaryWatch) {
            this.stationaryWatch.remove();
            this.stationaryWatch = null;
        }
    }

    async stationaryWatchHandler(stationary: boolean, jimuMapView: JimuMapView) {
        if (stationary && this.state.center) {
            let geoPoint = webMercatorToGeographic(this.state.center) as Point;
            if (geoPoint) {
                const w3wAddress = await w3wApi.convertTo3wa({
                    lat: geoPoint.y,
                    lng: geoPoint.x
                });

                this.setState({
                    w3wAddress
                });
                if (this.props.config.w3wOnMap) {
                    const textSym = {
                        type: "text",
                        text: w3wAddress.words,
                        font: { size: 12 },
                        horizontalAlignment: "left",
                        kerning: true,
                        rotated: false,
                        color: [225, 31, 38, 1],
                        xoffset: 10,
                        yoffset: -4
                    };
                    const w3wtext = new Graphic({
                        geometry: geoPoint,
                        symbol: textSym
                    });
                    this.w3wLayer.graphics.add(w3wtext);
                    const logoSym = {
                        type: "picture-marker",
                        url: "data:image/svg+xml;base64," + "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDYuMjcyNSAxNDYuMjcyNSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNlMTFmMjY7fS5jbHMtMntmaWxsOiNmZmY7fS5jbHMtM3tmaWxsOm5vbmU7fTwvc3R5bGU+PC9kZWZzPjxnIGlkPSJMYXllcl8yIiBkYXRhLW5hbWU9IkxheWVyIDIiPjxnIGlkPSJhcnR3b3JrIj48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMTcuMDIwNiwyOS4yNTIySDI5LjI1NDl2ODcuNzY1Nmg4Ny43NjU3VjI5LjI1MjJaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNjcuNjUyNSw5Mi4zMzQ2YTIuNzQ1NSwyLjc0NTUsMCwwLDEtMi42MDItMy42MUw3Ni4wMjEyLDU1LjgxMmEyLjc0MjksMi43NDI5LDAsMCwxLDUuMjA0MSwxLjczNTZMNzAuMjU0Niw5MC40NkEyLjc0MjksMi43NDI5LDAsMCwxLDY3LjY1MjUsOTIuMzM0NloiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik01MS4xOTY1LDkyLjMzNDZhMi43NDU2LDIuNzQ1NiwwLDAsMS0yLjYwMjEtMy42MUw1OS41NjUxLDU1LjgxMmEyLjc0MywyLjc0MywwLDAsMSw1LjIwNDIsMS43MzU2TDUzLjc5ODUsOTAuNDZBMi43NDI5LDIuNzQyOSwwLDAsMSw1MS4xOTY1LDkyLjMzNDZaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNODQuMTA4Niw5Mi4zMzQ2YTIuNzQ1NiwyLjc0NTYsMCwwLDEtMi42MDIxLTMuNjFMOTIuNDc3Miw1NS44MTJhMi43NDMsMi43NDMsMCwwLDEsNS4yMDQyLDEuNzM1Nkw4Ni43MTA3LDkwLjQ2QTIuNzQzLDIuNzQzLDAsMCwxLDg0LjEwODYsOTIuMzM0NloiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHdpZHRoPSIxNDYuMjcyNSIgaGVpZ2h0PSIxNDYuMjcyNSIvPjwvZz48L2c+PC9zdmc+",
                        contentType: 'image/svg',
                        width: 25,
                        height: 25
                    } as unknown as PictureMarkerSymbol;
                    const w3wlogo = new Graphic({
                        geometry: geoPoint,
                        symbol: logoSym
                    });
                    this.w3wLayer.graphics.add(w3wlogo);
                }
                if (this.props.config.showW3wSquare) {
                    const east = w3wAddress.square.northeast.lng;
                    const north = w3wAddress.square.northeast.lat;
                    const west = w3wAddress.square.southwest.lng;
                    const south = w3wAddress.square.southwest.lat;
                    const w3wGraphic = new Graphic({
                        geometry: new Polygon({
                            rings: [
                                [
                                    [west, north],
                                    [east, north],
                                    [east, south],
                                    [west, south],
                                    [west, north]
                                ]
                            ],
                            spatialReference: geoPoint.spatialReference    // WGS84
                        }),
                        symbol: {
                            type: "simple-line",
                            color: [225, 31, 38, 1],
                            width: "2px",
                            style: "short-dot"
                        }
                    });
                    this.w3wLayer.graphics.add(w3wGraphic);
                }
            }
            jimuMapView.view.map.add(this.w3wLayer);
        }
        else {
            this.w3wLayer.graphics.removeAll();
            jimuMapView.view.map.remove(this.w3wLayer);
        }
    }

    onActiveViewChange = (jimuMapView: JimuMapView) => {
        this.jimuMapView = jimuMapView;
    }

    switchLayers(evt: any) {
        console.log("switchLayers", evt, this.jimuMapView.view.map.layers);
        // this.jimuMapView.switchLayerVisibiliy....
    }

    render() {
        if (!this.isConfigured()) {
            return 'Select a map';
        }

        const dropdownItems = Object.keys(this.props.config.categories).map((cat: any) => {
            return <DropdownItem onClick={(evt: any) => {this.switchLayers(this.props.config.categories[cat])}}>
                        {defaultMessages[cat]}
                    </DropdownItem>;
        });

        return (<div className="widget-w3w p-3 m-4 surface-1">
            <h3>{defaultMessages.w3w}</h3>

            <Dropdown>
            <DropdownButton>Dropdown</DropdownButton>
            <DropdownMenu>
            <DropdownItem header>Header</DropdownItem>
            {dropdownItems}
            </DropdownMenu>
            </Dropdown>

            {
                this.props.hasOwnProperty("useMapWidgetIds") && this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1
                && (
                    <JimuMapViewComponent useMapWidgetIds={this.props.useMapWidgetIds} onActiveViewChange={this.onActiveViewChange}></JimuMapViewComponent>
                )
            }

            <table class="table table-striped">
                <tbody>
                    <tr>
                        <td scope="row">X</td>
                        <td>{this.state.center && this.state.center.x}</td>
                    </tr>
                    <tr>
                        <td scope="row">Y</td>
                        <td>{this.state.center && this.state.center.y}</td>
                    </tr>
                    <tr>
                        <th scope="row">{defaultMessages.center}</th>
                        <td>{this.state.w3wAddress && this.state.w3wAddress.words}</td>
                    </tr>
                </tbody>
            </table>
        </div >);
    }
}
