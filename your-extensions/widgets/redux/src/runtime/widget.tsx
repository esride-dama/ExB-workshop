/** @jsx jsx */
/**
  Licensing

  Copyright 2021 Esri

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
import { AllWidgetProps, BaseWidget, jsx, IMState } from 'jimu-core';
import { Input } from 'jimu-ui';

export default class Widget extends BaseWidget<AllWidgetProps<{}> & { a: string }, {}> {

    /**
     * Map the state your widget needs
     * @param state
     */
    static mapExtraStateProps(state: IMState) {
        console.log("redux mapExtraStateProps", state)
        return { a: state.myState.a };
    }

    onChange = (evt) => {
        console.log("redux onChange", evt.target.value, evt.target)
        this.props.dispatch({
            type: 'MY_ACTION_1',
            val: evt.target.value
        });
    }

    render() {
        return (
            <div className="widget-use-redux jimu-widget m-2">
                <Input onChange={this.onChange} />
                <div>{this.props.a} {this.props.b}</div>
            </div>
        );
    }
}
