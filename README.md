# Station
A helper agent for getting started integrating with spaces.

## Install

On a fake ship, running binary 1.13 and `zuse` version `417`, with [Realms already installed and configured](https://github.com/holium/realm), perform the following steps:

1. Create a new desk called `station`
  ```
  |new-desk %station
  ```

2. Mount the desk called `station`
  ```
  |mount %station
  ```

3. Copy the contents of the `/urbit` directory in this repo to the station desk.

4. Commit the new contents back to your urbit
  ```
  |commit %station
  ```

5. Install Station on that ship
  ```
  |install our %station
  ```

## Use
With Station installed you can perform the following actions:

* `:station [%all ~]`
  - Displays a `spaces` map
  - A `spaces` is a map of `space-path` to `space`
  - A `space-path` is a `[host=ship path=cord]`
  - A `space` is a series of details about a space (the concept).


* `:station [%host ~zod]`
  - Displays a `spaces` map, reduced for where `~zod` is host.


* `:station [%space wat=what sap=space-path]`
  - A `what` is one of the following:
    ```
    +$  what
      $?  %spaces
          %detail
          %host
          %owners
          %pending
          %initiates
          %members
          %administrators
      ==
    ```

  - Depending on which you choose, the display varies:
    + `%spaces` - displays the spaces also hosted by the host of the `space-path` you entered
    + `%detail` - displays the `space` details at that `space-path`
    + `%host` - gives you the host's `@p`
    + `%pending` - displays a `(set ship)` of pending invitees
    + `%owners` - displays a `(set ship)` of owners of the space
    + `%initiates` - displays a `(set ship)` of initiates to the space
    + `%members` - displays a `(set ship)` of members of the space
    + `%administrators` - displays a `(set ship)` of administrators in the space

## Build

When you're ready to build your own spaces-enabled application you'll want to know about the library running Station.

### `/lib/realm-lib/hoon`

`realm-lib` is designed to make working with spaces trivially easy. If your application needs to know something about the spaces available to you, `realm-lib` will help you extract that information without needing to write your own custom scries to get it. It also has imported `spaces-path` (as `s-p`), `spaces-store` (as `s-s`), `membership` (as `m-s`) and `visas` (as `v-s`) structure files from realm, making them available to you thru the single import of `realm-lib` in your agent (see Station's imports).

#### Inputs

Initializing `realm-lib` is easy and convenient. Using `re-abed` (which takes a `bowl:gall` and an `(each space-path (unit @p))`) in the `realm` core, you can start the library with:
1. Some `space-path` you're interested in (allows all outputs)
  ```
  (re-abed:realm:r-l bowl [%& [~zod 'a-space']])
  ```

2. Some `host` who may or may not run spaces (only allows `re-abet-saz` output)
  ```
  (re-abed:realm:r-l bowl [%| `~wet])
  ```

3. Nothing at all (only allows `re-abet-saz` output)
  ```
  (re-abed:realm:r-l bowl [%| ~])
  ```


#### Outputs

With the `realm-lib` initialized, you can call the following outputs:
```
  ++  re-abet-saz  `spaces`spaz                         ::  get spaces per query
  ++  re-abet-pen  `(set ship)`pend                     ::  get pending members
  ++  re-abet-ini  `(set ship)`inis                     ::  get initiates
  ++  re-abet-mem  `(set ship)`mems                     ::  get members
  ++  re-abet-adm  `(set ship)`adms                     ::  get administrators
  ++  re-abet-own  `(set ship)`owns                     ::  get owners
  ++  re-abet-hos  `ship`(need hust)                    ::  get host
  ++  re-abet-sap  `spat`(need sput)                    ::  get space-path
  ++  re-abet-det  `space`(need spuc)                   ::  get space details
```

#### Example Usage:
Station has several example usages employed in the poke arm:

```
++  poke
  |=  [mar=mark vaz=vase]
  ?>  =(%noun mar)
  =+  act=!<(action vaz)
  ?-  -.act
      %all
    ~&  >>>
      ^-  spaces:r-l
      re-abet-saz:(re-abed:realms:r-l bol [%| ~])
    dat
  ::
      %host  
    ~&  >>
      ^-  spaces:r-l
      re-abet-saz:(re-abed:realms:r-l bol [%| `who.act])
    dat
  ::
      %space
    =+  rel=(re-abed:realms:r-l bol [%& sap.act])
    ?-    wat.act
        %spaces
      ~&  >  `spaces:r-l`re-abet-saz:rel  dat
        %detail
      ~&  >  `space:r-l`re-abet-det:rel  dat
        %host
      ~&  >  `ship`re-abet-hos:rel  dat
        %owners
      ~&  >  `(set ship)`re-abet-own:rel  dat
        %pending
      ~&  >  `(set ship)`re-abet-pen:rel  dat
        %initiates
      ~&  >  `(set ship)`re-abet-ini:rel  dat
        %members
      ~&  >  `(set ship)`re-abet-mem:rel  dat
        %administrators
      ~&  >  `(set ship)`re-abet-adm:rel  dat
    ==
  ==
```