# Cartogram

Cartograms, or anamorphoses, are used in statistical cartography to show the importance of a given phenomenon.
They allow territorial units (polygons) to be distorted on the basis of a stock attribute (absolute quantitative variable)
relative to the surface area of the entities.

Three methods for creating cartograms are available in Magrit:

- the first, based on the Dougenik et al. algorithm (1), enables the creation of "contiguous" cartograms (the topology of the base map is preserved as far as possible),
- the second, based on Olson's algorithm (2), creates "non-contiguous" cartograms (the method does not seek to preserve the topology of the background map),
- the third, based on the Gastner, Seguy and More algorithm (3), creates "contiguous" cartograms (the topology of the background map is preserved as far as possible).

Methods (1) and (3) offer comparable results in terms of visual quality, but method (1) is generally faster.

## Attributes created on the result layer

The three methods of creating cartograms create a new attribute on the result layer.
This attribute has a slightly different meaning depending on the method used:

- For method (1), the created attribute is `area_error`, this represents the error between the calculated
  area and the target area (to determine how closely the calculated size of an entity matches what it
  should be if it had been resized perfectly; we display it in Magrit because it informs us about how
  "good" the resizing is). This value is also used as a "stop condition" internally to control when the
  algorithm should stop.
- For method (2), the created attribute is `scale`, this is by how much we apply the scale transformation
  to each feature (a scale of 2 would make the object 200% larger).
- For method (3), the created attribute is `area_error`, this represents the ratio between the desired target
  area for a polygon (proportional to the statistical value) and its current area.
  It is also used as an indicator of the algorithm’s convergence (and we also display it in Magrit because
  it informs us about how "good" the resizing is), but not as a stopping condition in our implementation,
  since the user manually selects the number of iterations.


## Example

<ZoomImg
    src="/cartograms.png"
    alt="The 3 types of cartograms applied to Paris neighborhoods (variable: Population 2012)"
    caption="The 3 types of cartograms applied to Paris neighborhoods (variable: Population 2012)"
/>

## References

(1) Dougenik, James A.; Chrisman, Nicholas R.; Niemeyer, Duane R. (1985), "An Algorithm to Construct Continuous Area Cartograms", *The Professional Geographer*, 37(1). [doi: 10.1111/j.0033-0124.1985.00075.x](https://doi.org/10.1111/j.0033-0124.1985.00075.x)

(2) Olson, Judy M. (1976). "Noncontiguous Area Cartograms". *The Professional Geographer*, 28(4). [doi: 10.1111/j.0033-0124.1976.00371.x](https://doi.org/10.1111/j.0033-0124.1976.00371.x)

(3) Gastner, Michael T.; Seguy, Vivien; More, Pratyush (2018). "Fast flow-based algorithm for creating density-equalizing map projections". *Proceedings of the National Academy of Sciences USA*, 115:E2156-E2164. [doi: 10.1073/pnas.1712674115](https://doi.org/10.1073/pnas.1712674115)


